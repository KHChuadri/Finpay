import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { groupRouter } from "../../../src/modules/group/group.routes";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import Groups from "../../../model/Groups";
import TransactionHistory from "../../../model/TransactionHistory";
import TransactionItem from "../../../model/TransactionItem";

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
  return Groups.create({
    admin: adminId,
    members: [adminId],
    groupName: "Test Group",
    walletBalance: overrides.walletBalance ?? 1000,
    walletCurrency: overrides.walletCurrency ?? "AUD",
  });
};

describe("POST /topup", () => {
  let debtor: UserType;
  let debtorWallet: Awaited<ReturnType<typeof createTestWallet>>;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    debtor = await createTestUser({ email: "debtor@test.com" });
    debtorWallet = await createTestWallet(debtor._id.toString(), "AUD", 1000);
    group = await createTestGroup(debtor._id.toString(), {
      walletBalance: 500,
    });
  });

  it("returns 200, moves funds, and records the transaction", async () => {
    const res = await request(makeApp()).post("/topup").send({
      debtorAccountWallet: debtorWallet._id.toString(),
      groupId: group._id.toString(),
      amountSrc: 100,
      amountDest: 100,
      srcCurrency: "AUD",
      destCurrency: "AUD",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Transfer successful",
      debtorWalletId: debtorWallet._id.toString(),
      creditorWalletId: group._id.toString(),
      amountTransferred: "100AUD",
      newDebtorBalance: 900,
      newCreditorBalance: 600,
    });

    const updatedWallet = await WalletInfo.findById(debtorWallet._id);
    const updatedGroup = await Groups.findById(group._id);
    expect(updatedWallet?.walletBalance).toBe(900);
    expect(updatedGroup?.walletBalance).toBe(600);

    const history = await TransactionHistory.find({});
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      amountSrc: 100,
      currencySource: "AUD",
      amountDest: 100,
      currencyDest: "AUD",
      fromAccountEmail: "debtor@test.com",
      toAccountEmail: "Test Group",
      description: "Shared Wallet Topup",
    });
    expect(history[0].fromAccount.toString()).toBe(debtor._id.toString());
    expect(history[0].toAccount.toString()).toBe(group._id.toString());

    const updatedDebtor = await mongoose
      .model("User")
      .findById(debtor._id);
    expect(
      updatedDebtor.transactionHistory.map((id: unknown) => String(id))
    ).toContain(history[0]._id.toString());
    expect(
      updatedGroup?.transactionHistory.map((id: unknown) => String(id))
    ).toContain(history[0]._id.toString());
  });

  it("returns 400 on insufficient balance", async () => {
    const res = await request(makeApp()).post("/topup").send({
      debtorAccountWallet: debtorWallet._id.toString(),
      groupId: group._id.toString(),
      amountSrc: 99999,
      amountDest: 99999,
      srcCurrency: "AUD",
      destCurrency: "AUD",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Insufficient balance" });

    const updatedWallet = await WalletInfo.findById(debtorWallet._id);
    expect(updatedWallet?.walletBalance).toBe(1000);
  });
});

describe("POST /withdraw", () => {
  let creditor: UserType;
  let creditorWallet: Awaited<ReturnType<typeof createTestWallet>>;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    creditor = await createTestUser({ email: "creditor@test.com" });
    creditorWallet = await createTestWallet(creditor._id.toString(), "AUD", 200);
    group = await createTestGroup(creditor._id.toString(), {
      walletBalance: 1000,
    });
  });

  it("returns 200, moves funds, and records the transaction (preserving the legacy newDeptorBalance key)", async () => {
    const res = await request(makeApp())
      .post("/withdraw")
      .send({
        creditorInfo: {
          email: creditor.email,
          walletInfo: [creditorWallet._id.toString()],
        },
        groupId: group._id.toString(),
        amountSrc: 100,
        amountDest: 100,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Transfer successful",
      creditorWalletId: creditorWallet._id.toString(),
      debtorWalletId: group._id.toString(),
      amountTransferred: "100AUD",
      newCreditorBalance: 300,
      newDeptorBalance: 900,
    });

    const updatedWallet = await WalletInfo.findById(creditorWallet._id);
    const updatedGroup = await Groups.findById(group._id);
    expect(updatedWallet?.walletBalance).toBe(300);
    expect(updatedGroup?.walletBalance).toBe(900);

    const history = await TransactionHistory.find({});
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      amountSrc: 100,
      currencySource: "AUD",
      amountDest: 100,
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
          walletInfo: [creditorWallet._id.toString()],
        },
        groupId: group._id.toString(),
        amountSrc: 99999,
        amountDest: 99999,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Insufficient balance" });

    const updatedGroup = await Groups.findById(group._id);
    expect(updatedGroup?.walletBalance).toBe(1000);
  });
});

describe("GET /group/transaction/history", () => {
  it("returns the raw TransactionHistory docs (asserts _id, not flattened)", async () => {
    const admin = await createTestUser({ email: "admin@test.com" });
    const group = await createTestGroup(admin._id.toString());

    const tx = await TransactionHistory.create({
      amountSrc: 50,
      currencySource: "AUD",
      amountDest: 50,
      currencyDest: "AUD",
      fromAccount: admin._id,
      toAccount: group._id,
      fromAccountEmail: admin.email,
      toAccountEmail: group.groupName,
      fromAccountId: admin._id.toString(),
      toAccountId: group._id.toString(),
      description: "Shared Wallet Topup",
    });

    group.transactionHistory.push(tx._id);
    await group.save();

    const res = await request(makeApp())
      .get("/group/transaction/history")
      .query({ groupId: group._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(tx._id.toString());
    expect(res.body[0]).toMatchObject({
      amountSrc: 50,
      currencySource: "AUD",
      description: "Shared Wallet Topup",
    });
    expect(res.body[0].createdAt).toBeDefined();
  });

  it("returns 400 when the group does not exist", async () => {
    const res = await request(makeApp())
      .get("/group/transaction/history")
      .query({ groupId: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "User not found or does not exist" });
  });
});

describe("POST /webhook", () => {
  it("Deposit-Request: credits the wallet and clears the pending TransactionItem", async () => {
    const user = await createTestUser({ email: "webhookuser@test.com" });
    await createTestWallet(user._id.toString(), "USD", 50);
    await TransactionItem.create({
      userId: user._id,
      transactionType: "Deposit",
      transactionId: "zai-item-1",
      currency: "USD",
      amount: 10000,
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

    const wallet = await WalletInfo.findOne({ userId: user._id, walletCurrency: "USD" });
    expect(wallet?.walletBalance).toBe(150);

    const remaining = await TransactionItem.findOne({ transactionId: "zai-item-1" });
    expect(remaining).toBeNull();
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
