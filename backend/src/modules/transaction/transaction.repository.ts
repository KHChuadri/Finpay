import { getDb } from "../../../lib/db";
import { users, wallets, transactions } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import HTTPError from "http-errors";
import type {
  ITransactionRepository,
  RecordTransactionInput,
  UserRecord,
  WalletRecord,
} from "./transaction.types";
import type { DbOrTx } from "../../../lib/db";

const run = (session?: DbOrTx) => session ?? getDb();

const toUserRecord = (r: {
  id: string;
  email: string;
  rank: string;
}): UserRecord => ({ id: r.id, email: r.email, rank: r.rank });

const toWalletRecord = (r: {
  id: string;
  userId: string;
  walletBalance: string;
  walletCurrency: string;
}): WalletRecord => ({
  id: r.id,
  userId: r.userId,
  balance: Number(r.walletBalance),
  currency: r.walletCurrency,
});

export const transactionRepository: ITransactionRepository = {
  async findUserById(id, session) {
    const [r] = await run(session)
      .select({ id: users.id, email: users.email, rank: users.rank })
      .from(users)
      .where(eq(users.id, id));
    return r ? toUserRecord(r) : null;
  },

  async findUserByEmail(email, session) {
    const [r] = await run(session)
      .select({ id: users.id, email: users.email, rank: users.rank })
      .from(users)
      .where(eq(users.email, email));
    return r ? toUserRecord(r) : null;
  },

  async findWallet(userId, currency, session) {
    const [r] = await run(session)
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },

  async createWallet(userId, currency, session) {
    const [r] = await run(session)
      .insert(wallets)
      .values({ userId, walletBalance: "0", walletCurrency: currency })
      .returning();
    return toWalletRecord(r);
  },

  async adjustWalletBalance(walletId, delta, session) {
    // Money arithmetic in SQL; CHECK (wallet_balance >= 0) enforces non-negative.
    const [r] = await run(session)
      .update(wallets)
      .set({ walletBalance: sql`${wallets.walletBalance} + ${String(delta)}` })
      .where(eq(wallets.id, walletId))
      .returning();
    if (!r) throw HTTPError(404, "Wallet not found");
    return Number(r.walletBalance);
  },

  async recordTransaction(input: RecordTransactionInput, session) {
    // User.transactionHistory[] is dropped; history is derived by querying
    // transactions.from_account / to_account (see Array→Relational Mapping).
    const [tx] = await run(session)
      .insert(transactions)
      .values({
        amountSrc: String(input.amountSrc),
        currencySource: input.currencySource,
        amountDest: String(input.amountDest),
        currencyDest: input.currencyDest,
        fromAccount: input.fromUser.id,
        toAccount: input.toUser.id,
        fromAccountEmail: input.fromUser.email,
        toAccountEmail: input.toUser.email,
        fromAccountId: input.fromUser.id,
        toAccountId: input.toUser.id,
        description: input.description,
      })
      .returning({ id: transactions.id });
    return tx.id;
  },
};
