import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import TransactionHistory from "../../../model/TransactionHistory";
import HTTPError from "http-errors";
import type {
  ITransactionRepository,
  RecordTransactionInput,
  UserRecord,
  WalletRecord,
} from "./transaction.types";

const toUserRecord = (doc: {
  _id: unknown;
  email: string;
  rank: string;
}): UserRecord => ({
  id: String(doc._id),
  email: doc.email,
  rank: doc.rank,
});

const toWalletRecord = (doc: {
  _id: unknown;
  userId: unknown;
  walletBalance: number;
  walletCurrency: string;
}): WalletRecord => ({
  id: String(doc._id),
  userId: String(doc.userId),
  balance: doc.walletBalance,
  currency: doc.walletCurrency,
});

export const transactionRepository: ITransactionRepository = {
  async findUserById(id) {
    const doc = await User.findById(id);
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByEmail(email) {
    const doc = await User.findOne({ email });
    return doc ? toUserRecord(doc) : null;
  },

  async findWallet(userId, currency) {
    const doc = await WalletInfo.findOne({
      userId,
      walletCurrency: currency,
    });
    return doc ? toWalletRecord(doc) : null;
  },

  async createWallet(userId, currency) {
    const doc = await WalletInfo.create({
      userId,
      walletBalance: 0,
      walletCurrency: currency,
    });
    await User.updateOne(
      { _id: userId },
      { $push: { walletInfo: doc._id } }
    );
    return toWalletRecord(doc);
  },

  async adjustWalletBalance(walletId, delta) {
    const doc = await WalletInfo.findById(walletId);
    if (!doc) {
      throw HTTPError(404, "Wallet not found");
    }
    doc.walletBalance += delta;
    await doc.save();
    return doc.walletBalance;
  },

  async recordTransaction(input: RecordTransactionInput) {
    const tx = await TransactionHistory.create({
      amountSrc: input.amountSrc,
      currencySource: input.currencySource,
      amountDest: input.amountDest,
      currencyDest: input.currencyDest,
      fromAccount: input.fromUser.id,
      toAccount: input.toUser.id,
      fromAccountEmail: input.fromUser.email,
      toAccountEmail: input.toUser.email,
      fromAccountId: input.fromUser.id,
      toAccountId: input.toUser.id,
      description: input.description,
    });

    const userIds =
      input.fromUser.id === input.toUser.id
        ? [input.fromUser.id]
        : [input.fromUser.id, input.toUser.id];

    await User.updateMany(
      { _id: { $in: userIds } },
      { $push: { transactionHistory: tx._id } }
    );

    return tx._id.toString();
  },
};
