import WalletInfo from "../../model/WalletInfo";
import User from "../../model/User";
import TransactionHistory from "../../model/TransactionHistory";
import HTTPError from "http-errors";
import Groups from "../../model/Groups";
import mongoose from "mongoose";

interface RecipientType {
  email: string;
  walletInfo: string[];
}

/**
 * <Withdraw/Pay From Group Wallet To User Wallet>
 * 
 * @param {string} debtorWalletId 
 * @param {string} groupId 
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
export const withdraw = async (
  creditorInfo: RecipientType,
  groupId: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) => {
  const creditorUser = await User.findOne({ email: creditorInfo.email });
  const group = await Groups.findById(groupId);

  if (!creditorUser) {
    throw HTTPError(404, "topup: user not found");
  } else if (!group) {
    throw HTTPError(404, "topup: Shared wallet not found");
  }
  let creditorWallet = await WalletInfo.findOne({
    _id: {
      $in: creditorInfo.walletInfo.map((id) => new mongoose.Types.ObjectId(id)),
    },
    walletCurrency: currencyDest,
  });

  if (!creditorWallet) {
    creditorWallet = await WalletInfo.create({
      userId: creditorUser._id,
      walletBalance: 0,
      walletCurrency: currencyDest,
    });

    await User.updateOne(
      { email: creditorInfo.email },
      { $push: { walletInfo: creditorWallet._id } }
    );
  }

  if (group.walletBalance - Number(amountSrc) < 0) {
    throw HTTPError(400, "Insufficient balance");
  }
  const transaction = await TransactionHistory.create({
    amountSrc,
    currencySource,
    amountDest,
    currencyDest,
    fromAccount: groupId,
    toAccount: creditorUser._id,
    fromAccountEmail: group.groupName,
    toAccountEmail: creditorUser.email,
    fromAccountId: group._id,
    toAccountId: creditorUser._id,
    description: "Shared Wallet Payment",
  });
  creditorUser.transactionHistory.push(transaction._id);
  group.transactionHistory.push(transaction._id);

  await creditorUser.save();
  await group.save();

  creditorWallet.walletBalance += Number(amountDest);
  group.walletBalance -= Number(amountSrc);
  await creditorWallet.save();
  await group.save();
  return {
    success: true,
    message: "Transfer successful",
    creditorWalletId: creditorWallet._id.toString(),
    debtorWalletId: group._id.toString(),
    amountTransferred: amountSrc.toString() + currencySource,
    newCreditorBalance: creditorWallet.walletBalance,
    newDeptorBalance: group.walletBalance,
  };
};
