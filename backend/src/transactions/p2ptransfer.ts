import WalletInfo from "../../model/WalletInfo";
import User from "../../model/User";
import TransactionHistory from "../../model/TransactionHistory";
import HTTPError from "http-errors";
import { trackChallengeProgress } from "../challenges/trackChallengeProgress";
import { Ranks } from "../ranks";
import { checkBalanceChallenges } from "../challenges/checkBalanceChallenges";
import { exchangeRate } from "../exchangeRate";

/**
 * <Executes Peer to Peer Transfer>
 * 
 * @param {string} debtorUserId
 * @param {string} creditorUserEmail 
 * @param {string} scheduledDate 
 * @param {number} amountSrc 
 * @param {number} amountDest 
 * @param {string} currencySource 
 * @param {string} currencyDest 
 * @returns {
 *   success: boolean,
 *   message: string,
 *   debtorWalletId: string,
 *   creditorWalletId: string,
 *   amountTransferred: string,
 *   newDebtorBalance: string,
 *   newCreditorBalance: string,
 * } object containing transaction informations
 */
export const p2pTransfer = async (
  debtorUserId: string,
  creditorEmail: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) => {
  if (amountSrc <= 0) {
    throw HTTPError(400, "Invalid transfer amount");
  }
  const debtorUser = await User.findById(debtorUserId);

  if (!debtorUser) {
    throw HTTPError(404, `p2ptransfer: UserId: ${debtorUserId} not found`)
  }

  const debtorWallet = await WalletInfo.findOne({
    userId: debtorUserId,
    walletCurrency: currencySource
  });

  if (!debtorWallet) {
    throw HTTPError(404, "p2ptransfer: Debtor wallet not found");
  }

  let creditorUserId;

  // self transfer set user as creditor
  if (creditorEmail === debtorUser?.email) {
    const creditor = await User.findById(debtorWallet.userId);
    creditorUserId = creditor?._id;
  } else {
    const creditor = await User.findOne({ email: creditorEmail });
    if (!creditor) {
      throw HTTPError(404, "User not found");
    }
    creditorUserId = creditor?._id;
  }

  let creditorWallet = await WalletInfo.findOne({
    userId: creditorUserId,
    walletCurrency: currencyDest
  });

  if (!creditorWallet) {
    creditorWallet = await WalletInfo.create({
      userId: creditorUserId,
      walletBalance: 0,
      walletCurrency: currencyDest,
    });

    await User.updateOne(
      { email: creditorEmail },
      { $push: { walletInfo: creditorWallet._id } }
    );
  }
  const creditorUser = await User.findById(creditorWallet.userId);

  if (!debtorUser || !creditorUser) {
    throw HTTPError(404, "User not found");
  }

  if (debtorWallet.walletBalance - Number(amountSrc) < 0) {
    throw HTTPError(400, "Insufficient balance");
  }

  // check transaction fee of transfer
  const debtorRank = debtorUser.rank;
  const serviceFee = Ranks.find((rank) => rank.name === debtorRank)?.serviceFee;

  // create transaction history
  const transaction = await TransactionHistory.create({
    amountSrc,
    currencySource,
    amountDest,
    currencyDest,
    fromAccount: debtorUser,
    toAccount: creditorUser,
    fromAccountEmail: debtorUser.email,
    toAccountEmail: creditorUser.email,
    fromAccountId: debtorUser._id,
    toAccountId: creditorUser._id,
    description: "P2P Transfer",
  });

  debtorUser.transactionHistory.push(transaction._id);
  creditorUser.transactionHistory.push(transaction._id);

  await debtorUser.save();
  await creditorUser.save();

  debtorWallet.walletBalance -= Number(amountSrc);
  creditorWallet.walletBalance += Number(amountDest - serviceFee!);
  await debtorWallet.save();
  await creditorWallet.save();

  await checkBalanceChallenges(debtorUserId!.toString());
  await checkBalanceChallenges(creditorUserId!.toString());

  // Convert everything to AUD for challenge progress check
  const amountSrcToAudRate = await exchangeRate(currencySource, "AUD");
  const amountDestToAudRate = await exchangeRate(currencyDest, "AUD");

  const amountSrcInAud = amountSrc * amountSrcToAudRate.rate;
  const amountDestInAud = amountDest * amountDestToAudRate.rate;

  await trackChallengeProgress(
    "pay",
    debtorUser._id.toString(),
    amountSrcInAud
  );
  await trackChallengeProgress(
    "receive",
    creditorUser._id.toString(),
    amountDestInAud
  );

  return {
    success: true,
    message: "Transfer successful",
    debtorWalletId: debtorWallet._id.toString(),
    creditorWalletId: creditorWallet._id.toString(),
    amountTransferred: amountSrc.toString() + currencySource,
    newDebtorBalance: debtorWallet.walletBalance,
    newCreditorBalance: creditorWallet.walletBalance,
  };
};
