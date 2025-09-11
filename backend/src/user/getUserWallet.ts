import User from "../../model/User";
import HTTPError from "http-errors";
import WalletInfo from "../../model/WalletInfo";

/**
 * <Get All Personal Wallet Owned By User>
 * 
 * @param {string} userId 
 * @returns { wallets } object containing array of user's walletinfo
 */
export const getUserWallet = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw HTTPError(404, "getUserWallet: user not found");
  }
  const wallets = await WalletInfo.find({ userId: userId });

  return { wallets };
};