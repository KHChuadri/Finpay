import { getDb } from "../../../lib/db";
import { wallets, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type {
  IWalletRepository,
  LeanWallet,
  UserWithWallets,
  WalletRecord,
} from "./wallet.types";

type WalletRow = typeof wallets.$inferSelect;

// Serialized wallet doc matching legacy `.lean()` output the frontend consumes.
const toLeanWallet = (r: WalletRow): LeanWallet => ({
  _id: r.id,
  userId: r.userId,
  walletBalance: Number(r.walletBalance),
  walletCurrency: r.walletCurrency,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toWalletRecord = (r: WalletRow): WalletRecord => ({
  id: r.id,
  userId: r.userId,
  walletBalance: Number(r.walletBalance),
  walletCurrency: r.walletCurrency,
});

export const walletRepository: IWalletRepository = {
  async findUserById(userId) {
    const [u] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    return u ? { id: u.id } : null;
  },

  async findUserWithWallets(userId): Promise<UserWithWallets | null> {
    const [u] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    if (!u) return null;
    const rows = await getDb().select().from(wallets).where(eq(wallets.userId, userId));
    return { id: u.id, wallets: rows.map(toLeanWallet) };
  },

  async findWalletsByUserId(userId) {
    const rows = await getDb().select().from(wallets).where(eq(wallets.userId, userId));
    return rows.map(toLeanWallet);
  },

  async findWallet(userId, currency) {
    const [r] = await getDb()
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },

  async createWallet(userId, currency) {
    const [r] = await getDb()
      .insert(wallets)
      .values({ userId, walletBalance: "0", walletCurrency: currency })
      .returning();
    return toWalletRecord(r);
  },

  async deleteWalletById(walletId) {
    const deleted = await getDb()
      .delete(wallets)
      .where(eq(wallets.id, walletId))
      .returning({ id: wallets.id });
    return deleted.length > 0;
  },
};
