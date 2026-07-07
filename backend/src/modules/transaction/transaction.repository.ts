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
  async findUserById(id, session) {
    const doc = await User.findById(id, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByEmail(email, session) {
    const doc = await User.findOne({ email }, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findWallet(userId, currency, session) {
    const doc = await WalletInfo.findOne(
      {
        userId,
        walletCurrency: currency,
      },
      null,
      { session }
    );
    return doc ? toWalletRecord(doc) : null;
  },

  async createWallet(userId, currency, session) {
    const [doc] = await WalletInfo.create(
      [
        {
          userId,
          walletBalance: 0,
          walletCurrency: currency,
        },
      ],
      { session }
    );
    await User.updateOne(
      { _id: userId },
      { $push: { walletInfo: doc._id } },
      { session }
    );
    return toWalletRecord(doc);
  },

  async adjustWalletBalance(walletId, delta, session) {
    const doc = await WalletInfo.findById(walletId, null, { session });
    if (!doc) {
      throw HTTPError(404, "Wallet not found");
    }
    doc.walletBalance += delta;
    await doc.save({ session });
    return doc.walletBalance;
  },

  async recordTransaction(input: RecordTransactionInput, session) {
    const [tx] = await TransactionHistory.create(
      [
        {
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
        },
      ],
      { session }
    );

    const userIds =
      input.fromUser.id === input.toUser.id
        ? [input.fromUser.id]
        : [input.fromUser.id, input.toUser.id];

    await User.updateMany(
      { _id: { $in: userIds } },
      { $push: { transactionHistory: tx._id } },
      { session }
    );

    return tx._id.toString();
  },
};
