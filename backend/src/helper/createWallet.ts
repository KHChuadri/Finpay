import { getDb } from "../../lib/db";
import { wallets } from "../db/schema";

/**
 * <Create A New User Currency Wallet>
 *
 * @param {string} userId
 * @param {string} walletCurrency
 * @param {number} walletBalance
 * @returns New Wallet Object
 */
export const createWallet = async (
  userId: string,
  walletCurrency: string,
  walletBalance: number
) => {
  // wallets.user_id FK records ownership; no user-side array to append.
  const [creditorWallet] = await getDb()
    .insert(wallets)
    .values({
      userId,
      walletBalance: String(walletBalance),
      walletCurrency,
    })
    .returning();

  return creditorWallet;
};
