import WalletInfo from "../model/WalletInfo";
import mongoose from "mongoose";
import HTTPError from "http-errors";

/**
 * <get currency wallet information>
 * 
 * @param {string} currency 
 * @param {string} userId 
 * @returns {walletBalance: number, walletCurrency: string} object containing wallet ballence and currency
 */
export const getCurrentWallet = async (currency: string, userId: string) => {
  const wallet = await WalletInfo.findOne({
    walletCurrency: currency,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!wallet) {
    throw HTTPError(404, "wallet not found");
  }

  return {
    walletId: wallet._id.toString(),
    walletBalance: wallet.walletBalance,
    walletCurrency: wallet.walletCurrency,
  };
};
