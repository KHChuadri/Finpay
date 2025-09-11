import HTTPError from "http-errors";
import User from "../../model/User";
import { WalletInfoType } from "../../model/WalletInfo";

/**
 * <Get a specific wallet that user owned>
 * 
 * @param {string} userId 
 * @param {string} currency 
 * @returns { correspondingWallet } object containing a WalletInfor Object
 */
export const getUserWalletInfo = async (
  userId: string,
  currency: string
): Promise<{ correspondingWallet: WalletInfoType }> => {
  if (!userId && !currency) {
    throw HTTPError(
      400,
      "getUserWalletInfo: Missing required fields: userId and currency"
    );
  }

  if (!userId) {
    throw HTTPError(400, "getUserWalletInfo: Missing required field: userId");
  }

  if (!currency) {
    throw HTTPError(400, "getUserWalletInfo: Missing required field: currency");
  }

  const user = await User.findById(userId).populate<{
    walletInfo: WalletInfoType[];
  }>("walletInfo");

  if (!user) {
    throw HTTPError(404, "getUserWalletInfo: No user found");
  }

  const correspondingWallet = user.walletInfo.find(
    (w) => w.walletCurrency === currency
  );

  if (!correspondingWallet) {
    throw HTTPError(
      404,
      "getUserWalletInfo: User has no wallet with corresponding currency."
    );
  }

  return { correspondingWallet };
};
