import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "../../../lib/db";
import { wallets } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { transactionRepository } from "../../../src/modules/transaction/transaction.repository";
import { transactionContainerWithTransaction as withTransaction } from "../../../src/modules/transaction/transaction.container";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";

describe("transaction ACID rollback", () => {
  let walletId: string;

  beforeEach(async () => {
    const user = await createTestUser({ email: "rollback@test.com" });
    const w = await createTestWallet(user.id, "AUD", 100);
    walletId = w.id;
  });

  it("rolls back the balance change when the tx body throws", async () => {
    await expect(
      withTransaction(async (tx) => {
        await transactionRepository.adjustWalletBalance(walletId, -50, tx);
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    const [after] = await getDb().select().from(wallets).where(eq(wallets.id, walletId));
    expect(Number(after.walletBalance)).toBe(100);
  });

  it("commits the balance change when the tx body succeeds", async () => {
    const newBalance = await withTransaction(async (tx) =>
      transactionRepository.adjustWalletBalance(walletId, -50, tx)
    );
    expect(newBalance).toBe(50);
    const [after] = await getDb().select().from(wallets).where(eq(wallets.id, walletId));
    expect(Number(after.walletBalance)).toBe(50);
  });
});
