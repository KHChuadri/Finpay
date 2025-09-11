import WalletInfo from "../../model/WalletInfo";
import User from "../../model/User";
import TransactionHistory from "../../model/TransactionHistory";
import HTTPError from "http-errors";
import { trackChallengeProgress } from "../challenges/trackChallengeProgress";
import { checkBalanceChallenges } from "../challenges/checkBalanceChallenges";
import { exchangeRate } from "../exchangeRate";
import Groups from "../../model/Groups";

export const topup = async (
  debtorWalletId: string,
  groupId: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) => {
  const debtorWallet = await WalletInfo.findById(debtorWalletId);
  const debtorUserId = debtorWallet?.userId;
  const group = await Groups.findById(groupId);

  if (!debtorWallet) {
    throw HTTPError(404, "topup: Debtor wallet not found");
  } else if (!group) {
    throw HTTPError(404, "topup: Shared wallet not found");
  }

  const debtorUser = await User.findById(debtorWallet.userId);

  if (!debtorUser) {
    throw HTTPError(404, "User not found");
  }

  if (debtorWallet.walletBalance - Number(amountSrc) < 0) {
    throw HTTPError(400, "Insufficient balance");
  }

  const transaction = await TransactionHistory.create({
    amountSrc,
    currencySource,
    amountDest,
    currencyDest,
    fromAccount: debtorUser,
    toAccount: groupId,
    fromAccountEmail: debtorUser.email,
    toAccountEmail: group.groupName,
    fromAccountId: debtorUser._id,
    toAccountId: group._id,
    description: "Shared Wallet Topup",
  });

  debtorUser.transactionHistory.push(transaction._id);
  group.transactionHistory.push(transaction._id);

  await debtorUser.save();
  await group.save();

  debtorWallet.walletBalance -= Number(amountSrc);
  group.walletBalance += Number(amountDest);
  await debtorWallet.save();
  await group.save();

  await checkBalanceChallenges(debtorUserId!.toString());

  // Convert everything to AUD
  const amountSrcToAudRate = await exchangeRate(currencySource, "AUD");
  const amountSrcInAud = amountSrc * amountSrcToAudRate.rate;

  await trackChallengeProgress(
    "pay",
    debtorUser._id.toString(),
    amountSrcInAud
  );

  return {
    success: true,
    message: "Transfer successful",
    debtorWalletId: debtorWallet._id.toString(),
    creditorWalletId: group._id.toString(),
    amountTransferred: amountSrc.toString() + currencySource,
    newDebtorBalance: debtorWallet.walletBalance,
    newCreditorBalance: group.walletBalance,
  };
};
