import Request from "../../model/Request";
import WalletInfo from "../../model/WalletInfo";
import User from "../../model/User";
import { p2pTransfer } from "./p2ptransfer";
import HTTPError from "http-errors";

/**
 * <Handle Request Transaction (Accepting)>
 * 
 * @param {string} requestId 
 * @returns { success: boolean, message: string } object containing process status and "Request accepted successfully" message
 */
export const acceptRequest = async (requestId: string) => {
  const request = await Request.findById(requestId);
  if (!request) throw HTTPError(404, "Request not found");

  const { userId, senderEmail, amount, currency } = request;

  const creditorUser = await User.findOne({ email: senderEmail });
  if (!creditorUser) throw HTTPError(404, "Sender user not found");

  const debtorWallet = await WalletInfo.findOne({ userId });
  const creditorWallets = await WalletInfo.find({ userId: creditorUser._id, walletCurrency: currency });

  if (!debtorWallet || !creditorWallets || creditorWallets.length === 0) {
    throw HTTPError(404, "User need to create a Wallets not found");
  }

  const amountSrc = amount;
  const amountDest = amount;
  const currencySource = currency;
  const currencyDest = currency;

  await p2pTransfer(
    userId.toString(),
    senderEmail,
    amountSrc,
    amountDest,
    currencySource,
    currencyDest
  );

  // Remove the request from both user and request collection
  await Request.findByIdAndDelete(requestId);
  await User.findByIdAndUpdate(userId, {
    $pull: { request: requestId },
  });

  return { success: true, message: "Request accepted successfully" };
};
