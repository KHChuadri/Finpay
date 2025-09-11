import User from "../model/User";
import HTTPError from "http-errors";

/**
 * <Find Recepient of Transaction>
 * 
 * @param {email} email 
 * @param {email} userId 
 * @returns {email: string , walletInfo: WalletInfo Object} object containg recepient email and target wallet
 */
export const findRecipient = async (email: string, userId: string) => {
  const self = await User.findById(userId);
  const recipient = email !== "SELF" ? await User.findOne({ email }) : self;

  if (!recipient) {
    throw HTTPError(404, "Recipient not found.");
  }

  const recipientWallet = recipient.walletInfo;

  if (!recipientWallet) {
    throw HTTPError(404, "Recipient has no wallet.");
  }

  return {
    email: recipient.email,
    walletInfo: recipientWallet,
  };
};
