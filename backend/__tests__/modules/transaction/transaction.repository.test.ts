import { describe, it, expect, beforeEach } from "vitest";
import { transactionRepository as repo } from "../../../src/modules/transaction/transaction.repository";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { wallets, transactions } from "../../../src/db/schema";
import { eq, or } from "drizzle-orm";

describe("transactionRepository", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    user = await createTestUser({ email: "repo@test.com", rank: "bronze" });
  });

  it("maps a user document to a flat UserRecord", async () => {
    const record = await repo.findUserById(user.id);
    expect(record).toEqual({
      id: user.id,
      email: "repo@test.com",
      rank: "bronze",
    });
  });

  it("returns null for a missing user", async () => {
    const record = await repo.findUserByEmail("nobody@test.com");
    expect(record).toBeNull();
  });

  it("finds a wallet as a flat WalletRecord", async () => {
    const w = await createTestWallet(user.id, "AUD", 250);
    const record = await repo.findWallet(user.id, "AUD");
    expect(record).toEqual({
      id: w.id,
      userId: user.id,
      balance: 250,
      currency: "AUD",
    });
  });

  it("creates a wallet linked to the user via the FK", async () => {
    const record = await repo.createWallet(user.id, "USD");
    expect(record.balance).toBe(0);
    expect(record.currency).toBe("USD");
    const [reloaded] = await getDb()
      .select()
      .from(wallets)
      .where(eq(wallets.id, record.id));
    expect(reloaded.userId).toBe(user.id);
  });

  it("adjusts a wallet balance and returns the new value", async () => {
    const w = await createTestWallet(user.id, "AUD", 100);
    const balance = await repo.adjustWalletBalance(w.id, -30);
    expect(balance).toBe(70);
    const [reloaded] = await getDb()
      .select()
      .from(wallets)
      .where(eq(wallets.id, w.id));
    expect(Number(reloaded.walletBalance)).toBe(70);
  });

  it("records a transaction discoverable from both users' account sides", async () => {
    const other = await createTestUser({ email: "other@test.com", rank: "bronze" });
    const txId = await repo.recordTransaction({
      fromUser: { id: user.id, email: user.email, rank: "bronze" },
      toUser: { id: other.id, email: other.email, rank: "bronze" },
      amountSrc: 100,
      amountDest: 100,
      currencySource: "AUD",
      currencyDest: "AUD",
      description: "P2P Transfer",
    });

    const [tx] = await getDb()
      .select()
      .from(transactions)
      .where(eq(transactions.id, txId));
    expect(tx.description).toBe("P2P Transfer");

    // Normalized: history derives from from_account / to_account, not an array.
    const fromHistory = await getDb()
      .select({ id: transactions.id })
      .from(transactions)
      .where(or(eq(transactions.fromAccount, user.id), eq(transactions.toAccount, user.id)));
    const toHistory = await getDb()
      .select({ id: transactions.id })
      .from(transactions)
      .where(or(eq(transactions.fromAccount, other.id), eq(transactions.toAccount, other.id)));
    expect(fromHistory.map((r) => r.id)).toContain(txId);
    expect(toHistory.map((r) => r.id)).toContain(txId);
  });
});
