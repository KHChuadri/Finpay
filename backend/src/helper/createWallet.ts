import User from "../../model/User";
import WalletInfo from "../../model/WalletInfo";

/**
 * <Create A New User Currency Wallet>
 * 
 * @param {string} userId 
 * @param {string} walletCurrency 
 * @param {number} walletBalance 
 * @returns New Wallet Object
 */
export const createWallet = async (userId: string, walletCurrency: string, walletBalance: number) => {
  const creditorWallet = await WalletInfo.create({
    userId: userId,
    walletBalance: walletBalance,
    walletCurrency: walletCurrency,
  });

  await User.updateOne(
    { _id: userId },
    { $push: { walletInfo: creditorWallet._id } }
  );

  return creditorWallet;
}