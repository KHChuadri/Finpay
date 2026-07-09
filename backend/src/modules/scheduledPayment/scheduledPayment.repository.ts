import { getDb } from "../../../lib/db";
import { users, wallets, scheduledPayments } from "../../db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import type {
  IScheduledPaymentRepository,
  UserBasic,
} from "./scheduledPayment.types";

const toUserBasic = (r: { id: string; email: string }): UserBasic => ({
  id: r.id,
  email: r.email,
});

export const scheduledPaymentRepository: IScheduledPaymentRepository = {
  async findUserById(id) {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id));
    return r ? toUserBasic(r) : null;
  },

  async findUserByEmail(email) {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email));
    return r ? toUserBasic(r) : null;
  },

  async createPayment(input) {
    const [r] = await getDb()
      .insert(scheduledPayments)
      .values({
        debtorId: input.debtorId,
        creditorId: input.creditorId,
        amountSrc: String(input.amountSrc),
        amountDest: String(input.amountDest),
        currencySrc: input.currencySrc,
        currencyDest: input.currencyDest,
        scheduledDate: new Date(input.scheduledDate),
      })
      .returning();
    return { id: r.id, debtorId: r.debtorId, creditorId: r.creditorId };
  },

  async updateJobId(paymentId, jobId) {
    await getDb()
      .update(scheduledPayments)
      .set({ jobId })
      .where(eq(scheduledPayments.id, paymentId));
  },

  async findWalletByUserAndCurrency(userId, currency) {
    const [r] = await getDb()
      .select({ id: wallets.id, walletBalance: wallets.walletBalance })
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? { id: r.id, walletBalance: Number(r.walletBalance) } : null;
  },

  async debitWalletById(walletId, amount) {
    await getDb()
      .update(wallets)
      .set({ walletBalance: sql`${wallets.walletBalance} - ${String(amount)}` })
      .where(eq(wallets.id, walletId));
  },

  async findPaymentById(paymentId) {
    const [r] = await getDb()
      .select()
      .from(scheduledPayments)
      .where(eq(scheduledPayments.id, paymentId));
    if (!r) return null;
    return {
      id: r.id,
      debtorId: r.debtorId,
      status: r.status ?? "pending",
      jobId: r.jobId ?? undefined,
      amountSrc: Number(r.amountSrc),
      currencySrc: r.currencySrc,
    };
  },

  async deletePaymentById(paymentId) {
    await getDb().delete(scheduledPayments).where(eq(scheduledPayments.id, paymentId));
  },

  async creditWallet(userId, currency, amount) {
    await getDb()
      .update(wallets)
      .set({ walletBalance: sql`${wallets.walletBalance} + ${String(amount)}` })
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
  },

  async countPaymentsByDebtor(userId) {
    const [r] = await getDb()
      .select({ n: count() })
      .from(scheduledPayments)
      .where(eq(scheduledPayments.debtorId, userId));
    return r.n;
  },

  async findPendingPaymentsByDebtor(userId, skip, limit) {
    const rows = await getDb()
      .select()
      .from(scheduledPayments)
      .where(
        and(
          eq(scheduledPayments.debtorId, userId),
          eq(scheduledPayments.status, "pending")
        )
      )
      .orderBy(desc(scheduledPayments.createdAt))
      .offset(skip)
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      debtorId: r.debtorId,
      creditorId: r.creditorId,
      amountSrc: Number(r.amountSrc),
      amountDest: Number(r.amountDest),
      currencySrc: r.currencySrc,
      currencyDest: r.currencyDest,
      scheduledDate: r.scheduledDate,
    }));
  },
};
