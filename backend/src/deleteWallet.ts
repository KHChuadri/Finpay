import WalletInfo from "../model/WalletInfo";
import mongoose from "mongoose";
import HTTPError from "http-errors";

/**
 * <Delete Currency Wallet>
 * 
 * @param {string} currency 
 * @param {string} userId 
 * @returns {message: string} object containing message "Wallet deleted successfully" 
 */
export const deleteWallet = async (currency: string, userId: string) => {
  const wallet = await WalletInfo.findOne({
    walletCurrency: currency,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!wallet) {
    throw HTTPError(404, "wallet not found");
  }

  const deletedWallet = await WalletInfo.findByIdAndDelete(wallet._id);

  if (!deletedWallet) {
    throw HTTPError(500, "Wallet deletion failed");
  }

  return { message: "Wallet deleted successfully" };
};
