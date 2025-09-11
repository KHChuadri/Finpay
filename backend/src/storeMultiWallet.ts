import User from "../model/User"
import HTTPError from "http-errors";
import WalletInfo from "../model/WalletInfo";

/**
 * <Create new currency wallet>
 * 
 * @param {string} userId 
 * @param {string} walletCurrency 
 * @returns { message: {string} "Store multi wallet successful" } object containing success message
 */
export const storeMultiWallet = async (userId: string, walletCurrency: string) => {
  const findUser = await User.findById(userId);
  const findWallet = await WalletInfo.findOne({ userId, walletCurrency: walletCurrency });

  // error checking for non-existent user
  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  // if a currency already exists, do not re-add it
  if (findWallet) {
    throw HTTPError(400, "This currency has already been added to your wallet");
  }

  const newCurrency = new WalletInfo({
    userId,
    walletBalance: 0,
    walletCurrency: walletCurrency,
  });
  await newCurrency.save();

  findUser.walletInfo.push(newCurrency._id);
  await findUser.save();

  return { message: "Store multi wallet successful" };
}