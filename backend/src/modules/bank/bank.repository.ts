import mongoose from "mongoose";
import { UUID } from "mongodb";
import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import TransactionItem from "../../../model/TransactionItem";
import type { IBankRepository } from "./bank.types";

export const bankRepository: IBankRepository = {
  async findUserById(userId) {
    const doc = await User.findById(userId);
    return doc
      ? {
          id: String(doc._id),
          firstName: doc.firstName,
          lastName: doc.lastName,
          depositId: doc.depositId,
        }
      : null;
  },

  async findMainWallet(userId) {
    const doc = await WalletInfo.findOne({
      userId,
      walletCurrency: "AUD",
    });
    return doc ? { id: String(doc._id), walletBalance: doc.walletBalance } : null;
  },

  async generateUniqueTransactionId() {
    let transactionId = new UUID();
    while ((await TransactionItem.findOne({ transactionId })) != null) {
      transactionId = new UUID();
    }
    return transactionId as unknown as string;
  },

  async createTransactionItem(input) {
    const item = new TransactionItem({
      transactionType: input.transactionType,
      userId: new mongoose.Types.ObjectId(input.userId),
      transactionId: input.transactionId,
      amount: input.amount,
      depositId: input.depositId,
      date: new Date(),
      currency: "AUD",
      name: input.name,
    });
    await item.save();
  },

  async debitMainWallet(userId, amount) {
    const wallet = await WalletInfo.findOne({
      userId,
      walletCurrency: "AUD",
    });
    if (!wallet) {
      return;
    }
    wallet.walletBalance = wallet.walletBalance - amount;
    await wallet.save();
  },

  deleteTransactionItemByTransactionId(transactionId) {
    // NOTE: intentionally not awaited — see IBankRepository jsdoc.
    return TransactionItem.findOneAndDelete({ transactionId });
  },
};
