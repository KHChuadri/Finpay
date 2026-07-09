import { randomUUID } from "crypto";
import { getDb } from "../../../lib/db";
import { users, wallets, transactionItems } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { IBankRepository } from "./bank.types";

export const bankRepository: IBankRepository = {
  async findUserById(userId) {
    const [u] = await getDb()
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        depositId: users.depositId,
      })
      .from(users)
      .where(eq(users.id, userId));
    return u
      ? { id: u.id, firstName: u.firstName, lastName: u.lastName, depositId: u.depositId }
      : null;
  },

  async findMainWallet(userId) {
    const [w] = await getDb()
      .select({ id: wallets.id, walletBalance: wallets.walletBalance })
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, "AUD")));
    return w ? { id: w.id, walletBalance: Number(w.walletBalance) } : null;
  },

  async generateUniqueTransactionId() {
    let transactionId = randomUUID();
    while (
      (
        await getDb()
          .select({ id: transactionItems.id })
          .from(transactionItems)
          .where(eq(transactionItems.transactionId, transactionId))
      ).length > 0
    ) {
      transactionId = randomUUID();
    }
    return transactionId;
  },

  async createTransactionItem(input) {
    await getDb().insert(transactionItems).values({
      transactionType: input.transactionType,
      userId: input.userId,
      transactionId: input.transactionId,
      amount: String(input.amount),
      depositId: input.depositId,
      date: new Date(),
      currency: "AUD",
      name: input.name,
    });
  },

  async debitMainWallet(userId, amount) {
    await getDb()
      .update(wallets)
      .set({ walletBalance: sql`${wallets.walletBalance} - ${String(amount)}` })
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, "AUD")));
  },

  deleteTransactionItemByTransactionId(transactionId) {
    // Mirrors a legacy bug: the delete is never awaited/executed, so the
    // underlying item is never actually removed. Preserved for parity.
    return getDb()
      .delete(transactionItems)
      .where(eq(transactionItems.transactionId, transactionId));
  },
};
