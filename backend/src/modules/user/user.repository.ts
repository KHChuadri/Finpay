import { getDb } from "../../../lib/db";
import { users, transactions } from "../../db/schema";
import { eq, or, inArray } from "drizzle-orm";
import type {
  IUserRepository,
  LeanTransaction,
  UserAdminRecord,
  UserRankRecord,
  UserWithTransactionHistory,
} from "./user.types";

type TxRow = typeof transactions.$inferSelect;

const toLeanTx = (r: TxRow): LeanTransaction => ({
  _id: r.id,
  transactionType: r.transactionType,
  amountSrc: Number(r.amountSrc),
  currencySource: r.currencySource,
  amountDest: Number(r.amountDest),
  currencyDest: r.currencyDest,
  fromAccount: r.fromAccount,
  toAccount: r.toAccount,
  fromAccountEmail: r.fromAccountEmail,
  toAccountEmail: r.toAccountEmail,
  fromAccountId: r.fromAccountId,
  toAccountId: r.toAccountId,
  transactionDate: r.transactionDate,
  description: r.description,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export const userRepository: IUserRepository = {
  async findUserRankById(userId): Promise<UserRankRecord | null> {
    const [u] = await getDb()
      .select({ id: users.id, rank: users.rank })
      .from(users)
      .where(eq(users.id, userId));
    return u ? { id: u.id, rank: u.rank } : null;
  },

  async findUserAdminById(userId): Promise<UserAdminRecord | null> {
    const [u] = await getDb()
      .select({ id: users.id, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId));
    return u ? { id: u.id, isAdmin: u.isAdmin } : null;
  },

  async findUserWithTransactionHistory(
    userId
  ): Promise<UserWithTransactionHistory | null> {
    const [u] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    if (!u) return null;
    // Normalized: history derives from from_account / to_account, not an array.
    const rows = await getDb()
      .select({ id: transactions.id })
      .from(transactions)
      .where(or(eq(transactions.fromAccount, userId), eq(transactions.toAccount, userId)));
    return { id: u.id, transactionHistory: rows.map((r) => r.id) };
  },

  async findTransactionHistoryByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(transactions)
      .where(inArray(transactions.id, ids));
    return rows.map(toLeanTx);
  },
};
