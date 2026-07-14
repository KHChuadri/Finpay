import { getDb } from "../../lib/db";
import { users, wallets, transactions, scheduledPayments } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createWallet } from "../helper/createWallet";
import { challengeService } from "../modules/challenge/challenge.container";

const { checkBalanceChallenges } = challengeService;

interface PaymentTransactionData {
  debtorId: string;
  creditorId: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  paymentId: string;
}

/**
 * <Handles Scheduled Payment Proccessing>
 *
 * @param PaymentTransactionData
 * @returns {status: string, transactionId: string / Error: Error} object containing process status and transaction history id or error message
 */
export const processPaymentTransaction = async (data: PaymentTransactionData) => {
  try {
    const result = await getDb().transaction(async (tx) => {
      const [debtor] = await tx.select().from(users).where(eq(users.id, data.debtorId));
      const [creditor] = await tx.select().from(users).where(eq(users.id, data.creditorId));

      if (!debtor || !creditor) {
        throw new Error("Debtor or creditor user not found");
      }

      const [creditorWallet] = await tx
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, data.creditorId), eq(wallets.walletCurrency, data.currencyDest)));

      if (!creditorWallet) {
        await createWallet(data.creditorId, data.currencyDest, data.amountDest);
      }

      const [txn] = await tx
        .insert(transactions)
        .values({
          amountSrc: String(data.amountSrc),
          currencySource: data.currencySrc,
          amountDest: String(data.amountDest),
          currencyDest: data.currencyDest,
          fromAccount: debtor.id,
          toAccount: creditor.id,
          fromAccountEmail: debtor.email,
          toAccountEmail: creditor.email,
          fromAccountId: debtor.id,
          toAccountId: creditor.id,
          description: "Scheduled payment",
        })
        .returning({ id: transactions.id });

      const transactionId = txn.id;

      await tx
        .update(wallets)
        .set({ walletBalance: sql`${wallets.walletBalance} + ${String(data.amountDest)}` })
        .where(and(eq(wallets.userId, data.creditorId), eq(wallets.walletCurrency, data.currencyDest)));

      await checkBalanceChallenges(data.creditorId);
      await checkBalanceChallenges(data.debtorId);

      await tx
        .update(scheduledPayments)
        .set({ status: "completed", processedAt: new Date(), transactionId })
        .where(eq(scheduledPayments.id, data.paymentId));

      return { success: true, transactionId };
    });

    return {
      success: result.success !== undefined,
      transactionId: result.transactionId ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment processing failed",
    };
  }
};
