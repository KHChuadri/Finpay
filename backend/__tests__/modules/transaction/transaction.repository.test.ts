import { describe, it, expect, beforeEach } from "vitest";
import { transactionRepository as repo } from "../../../src/modules/transaction/transaction.repository";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import User, { UserType } from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import TransactionHistory from "../../../model/TransactionHistory";

describe("transactionRepository", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ email: "repo@test.com", rank: "bronze" });
  });

  it("maps a user document to a flat UserRecord", async () => {
    const record = await repo.findUserById(user._id.toString());
    expect(record).toEqual({
      id: user._id.toString(),
      email: "repo@test.com",
      rank: "bronze",
    });
  });

  it("returns null for a missing user", async () => {
    const record = await repo.findUserByEmail("nobody@test.com");
    expect(record).toBeNull();
  });

  it("finds a wallet as a flat WalletRecord", async () => {
    const w = await createTestWallet(user._id.toString(), "AUD", 250);
    const record = await repo.findWallet(user._id.toString(), "AUD");
    expect(record).toEqual({
      id: w._id.toString(),
      userId: user._id.toString(),
      balance: 250,
      currency: "AUD",
    });
  });

  it("creates a wallet and links it to the user", async () => {
    const record = await repo.createWallet(user._id.toString(), "USD");
    expect(record.balance).toBe(0);
    expect(record.currency).toBe("USD");
    const updated = await User.findById(user._id);
    expect(updated?.walletInfo.map(String)).toContain(record.id);
  });

  it("adjusts a wallet balance and returns the new value", async () => {
    const w = await createTestWallet(user._id.toString(), "AUD", 100);
    const balance = await repo.adjustWalletBalance(w._id.toString(), -30);
    expect(balance).toBe(70);
    const reloaded = await WalletInfo.findById(w._id);
    expect(reloaded?.walletBalance).toBe(70);
  });

  it("records a transaction and appends it to both users once", async () => {
    const other = await createTestUser({ email: "other@test.com", rank: "bronze" });
    const txId = await repo.recordTransaction({
      fromUser: { id: user._id.toString(), email: user.email, rank: "bronze" },
      toUser: { id: other._id.toString(), email: other.email, rank: "bronze" },
      amountSrc: 100, amountDest: 100,
      currencySource: "AUD", currencyDest: "AUD",
      description: "P2P Transfer",
    });

    const tx = await TransactionHistory.findById(txId);
    expect(tx?.description).toBe("P2P Transfer");
    const from = await User.findById(user._id);
    const to = await User.findById(other._id);
    expect(from?.transactionHistory.map(String)).toContain(txId);
    expect(to?.transactionHistory.map(String)).toContain(txId);
  });
});
