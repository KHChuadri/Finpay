import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { groupRouter } from "../../../src/modules/group/group.routes";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import {
  wallets,
  groups,
  groupMembers,
  transactions,
  transactionItems,
} from "../../../src/db/schema";
import { eq, or } from "drizzle-orm";

vi.mock("../../../src/modules/challenge/challenge.container", () => ({
  challengeService: {
    trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
    checkBalanceChallenges: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("../../../src/modules/exchange/exchange.container", () => ({
  exchangeService: {
    getRate: vi.fn().mockResolvedValue({ rate: 1 }),
  },
}));

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(groupRouter);
  return app;
};

const createTestGroup = async (
  adminId: string,
  overrides: Partial<{ walletBalance: number; walletCurrency: string }> = {}
) => {
  const [g] = await getDb()
    .insert(groups)
    .values({
      adminId,
      groupName: "Test Group",
      walletBalance: String(overrides.walletBalance ?? 1000),
      walletCurrency: overrides.walletCurrency ?? "AUD",
    })
    .returning();
  await getDb()
    .insert(groupMembers)
    .values({ groupId: g.id, userId: adminId })
    .onConflictDoNothing();
  return { ...g, _id: g.id };
};

const balanceOfWallet = async (walletId: string) => {
  const [w] = await getDb().select().from(wallets).where(eq(wallets.id, walletId));
  return Number(w.walletBalance);
};
const balanceOfGroup = async (groupId: string) => {
  const [g] = await getDb().select().from(groups).where(eq(groups.id, groupId));
  return Number(g.walletBalance);
};

describe("POST /topup", () => {
  let debtor: TestUser;
  let debtorWallet: Awaited<ReturnType<typeof createTestWallet>>;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    debtor = await createTestUser({ email: "debtor@test.com" });
    debtorWallet = await createTestWallet(debtor.id, "AUD", 1000);
    group = await createTestGroup(debtor.id, { walletBalance: 500 });
  });

  it("returns 200, moves funds, and records the transaction", async () => {
    const res = await request(makeApp()).post("/topup").send({
      debtorAccountWallet: debtorWallet.id,
      groupId: group.id,
      amountSrc: 100,
      amountDest: 100,
      srcCurrency: "AUD",
      destCurrency: "AUD",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Transfer successful",
      debtorWalletId: debtorWallet.id,
      creditorWalletId: group.id,
      amountTransferred: "100AUD",
      newDebtorBalance: 900,
      newCreditorBalance: 600,
    });

    expect(await balanceOfWallet(debtorWallet.id)).toBe(900);
    expect(await balanceOfGroup(group.id)).toBe(600);

    const history = await getDb().select().from(transactions);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      currencySource: "AUD",
      currencyDest: "AUD",
      fromAccountEmail: "debtor@test.com",
      toAccountEmail: "Test Group",
      description: "Shared Wallet Topup",
    });
    expect(Number(history[0].amountSrc)).toBe(100);
    expect(Number(history[0].amountDest)).toBe(100);
    expect(history[0].fromAccount).toBe(debtor.id);
    expect(history[0].toAccount).toBe(group.id);

    // Normalized: debtor's history derives from from/to account; group's from group_id.
    const debtorHistory = await getDb()
      .select({ id: transactions.id })
      .from(transactions)
      .where(or(eq(transactions.fromAccount, debtor.id), eq(transactions.toAccount, debtor.id)));
    const groupHistory = await getDb()
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.groupId, group.id));
    expect(debtorHistory.map((r) => r.id)).toContain(history[0].id);
    expect(groupHistory.map((r) => r.id)).toContain(history[0].id);
  });

  it("returns 400 on insufficient balance", async () => {
    const res = await request(makeApp()).post("/topup").send({
      debtorAccountWallet: debtorWallet.id,
      groupId: group.id,
      amountSrc: 99999,
      amountDest: 99999,
      srcCurrency: "AUD",
      destCurrency: "AUD",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Insufficient balance" });
    expect(await balanceOfWallet(debtorWallet.id)).toBe(1000);
  });
});

describe("POST /withdraw", () => {
  let creditor: TestUser;
  let creditorWallet: Awaited<ReturnType<typeof createTestWallet>>;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    creditor = await createTestUser({ email: "creditor@test.com" });
    creditorWallet = await createTestWallet(creditor.id, "AUD", 200);
    group = await createTestGroup(creditor.id, { walletBalance: 1000 });
  });

  it("returns 200, moves funds, and records the transaction (preserving the legacy newDeptorBalance key)", async () => {
    const res = await request(makeApp())
      .post("/withdraw")
      .send({
        creditorInfo: {
          email: creditor.email,
          walletInfo: [creditorWallet.id],
        },
        groupId: group.id,
        amountSrc: 100,
        amountDest: 100,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Transfer successful",
      creditorWalletId: creditorWallet.id,
      debtorWalletId: group.id,
      amountTransferred: "100AUD",
      newCreditorBalance: 300,
      newDeptorBalance: 900,
    });

    expect(await balanceOfWallet(creditorWallet.id)).toBe(300);
    expect(await balanceOfGroup(group.id)).toBe(900);

    const history = await getDb().select().from(transactions);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      currencySource: "AUD",
      currencyDest: "AUD",
      fromAccountEmail: "Test Group",
      toAccountEmail: "creditor@test.com",
      description: "Shared Wallet Payment",
    });
  });

  it("returns 400 on insufficient group balance", async () => {
    const res = await request(makeApp())
      .post("/withdraw")
      .send({
        creditorInfo: {
          email: creditor.email,
          walletInfo: [creditorWallet.id],
        },
        groupId: group.id,
        amountSrc: 99999,
        amountDest: 99999,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Insufficient balance" });
    expect(await balanceOfGroup(group.id)).toBe(1000);
  });
});

describe("GET /group/transaction/history", () => {
  it("returns the raw TransactionHistory docs (asserts _id, not flattened)", async () => {
    const admin = await createTestUser({ email: "admin@test.com" });
    const group = await createTestGroup(admin.id);

    const [tx] = await getDb()
      .insert(transactions)
      .values({
        amountSrc: "50",
        currencySource: "AUD",
        amountDest: "50",
        currencyDest: "AUD",
        fromAccount: admin.id,
        toAccount: group.id,
        fromAccountEmail: admin.email,
        toAccountEmail: group.groupName,
        fromAccountId: admin.id,
        toAccountId: group.id,
        groupId: group.id,
        description: "Shared Wallet Topup",
      })
      .returning();

    const res = await request(makeApp())
      .get("/group/transaction/history")
      .query({ groupId: group.id });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(tx.id);
    expect(res.body[0]).toMatchObject({
      currencySource: "AUD",
      description: "Shared Wallet Topup",
    });
    expect(Number(res.body[0].amountSrc)).toBe(50);
    expect(res.body[0].createdAt).toBeDefined();
  });

  it("returns 400 when the group does not exist", async () => {
    const res = await request(makeApp())
      .get("/group/transaction/history")
      .query({ groupId: randomUUID() });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "User not found or does not exist" });
  });
});

describe("POST /webhook", () => {
  it("Deposit-Request: credits the wallet and clears the pending TransactionItem", async () => {
    const user = await createTestUser({ email: "webhookuser@test.com" });
    await createTestWallet(user.id, "USD", 50);
    await getDb().insert(transactionItems).values({
      userId: user.id,
      transactionType: "Deposit",
      transactionId: "zai-item-1",
      currency: "USD",
      amount: "10000",
      name: "pending-deposit",
    });

    const res = await request(makeApp())
      .post("/webhook")
      .send({
        items: {
          id: "zai-item-1",
          name: "Deposit-Request",
          description: user.depositId,
          state: "completed",
          amount: 10000,
          currency: "USD",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("depositId");

    const [wallet] = await getDb()
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id));
    expect(Number(wallet.walletBalance)).toBe(150);

    const remaining = await getDb()
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, "zai-item-1"));
    expect(remaining).toHaveLength(0);
  });

  it("returns 400 when a Deposit-Request has already been processed (no matching TransactionItem)", async () => {
    const user = await createTestUser({ email: "alreadyprocessed@test.com" });

    const res = await request(makeApp())
      .post("/webhook")
      .send({
        items: {
          id: "zai-item-missing",
          name: "Deposit-Request",
          description: user.depositId,
          state: "completed",
          amount: 10000,
          currency: "USD",
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Deposit Has Been Processed" });
  });
});
