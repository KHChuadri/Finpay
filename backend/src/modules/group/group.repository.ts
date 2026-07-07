import mongoose from "mongoose";
import HTTPError from "http-errors";
import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import Groups from "../../../model/Groups";
import TransactionHistory from "../../../model/TransactionHistory";
import TransactionItem from "../../../model/TransactionItem";
import type {
  GroupRecord,
  IGroupRepository,
  RecordGroupTransactionInput,
  UserRecord,
  WalletRecord,
} from "./group.types";

const toUserRecord = (doc: { _id: unknown; email: string }): UserRecord => ({
  id: String(doc._id),
  email: doc.email,
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

const toGroupRecord = (doc: {
  _id: unknown;
  groupName: string;
  walletBalance: number;
  walletCurrency: string;
  transactionHistory: unknown[];
}): GroupRecord => ({
  id: String(doc._id),
  groupName: doc.groupName,
  walletBalance: doc.walletBalance,
  walletCurrency: doc.walletCurrency,
  transactionHistoryIds: (doc.transactionHistory ?? []).map((id) =>
    String(id)
  ),
});

export const groupRepository: IGroupRepository = {
  async findUserById(id, session) {
    const doc = await User.findById(id, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByEmail(email, session) {
    const doc = await User.findOne({ email }, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByDepositId(depositId, session) {
    const doc = await User.findOne({ depositId }, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async appendUserTransactionHistory(userId, transactionId, session) {
    await User.updateOne(
      { _id: userId },
      { $push: { transactionHistory: transactionId } },
      { session }
    );
  },

  async findGroupById(id, session) {
    const doc = await Groups.findById(id, null, { session });
    return doc ? toGroupRecord(doc) : null;
  },

  async adjustGroupBalance(groupId, delta, session) {
    const doc = await Groups.findById(groupId, null, { session });
    if (!doc) {
      throw HTTPError(404, "Group not found");
    }
    doc.walletBalance += delta;
    await doc.save({ session });
    return doc.walletBalance;
  },

  async appendGroupTransactionHistory(groupId, transactionId, session) {
    await Groups.updateOne(
      { _id: groupId },
      { $push: { transactionHistory: transactionId } },
      { session }
    );
  },

  async findTransactionHistoryByIds(ids) {
    return TransactionHistory.find({ _id: { $in: ids } }).lean();
  },

  async findWalletById(id, session) {
    const doc = await WalletInfo.findById(id, null, { session });
    return doc ? toWalletRecord(doc) : null;
  },

  async findWalletByUserAndCurrency(userId, currency, session) {
    const doc = await WalletInfo.findOne(
      { userId, walletCurrency: currency },
      null,
      { session }
    );
    return doc ? toWalletRecord(doc) : null;
  },

  async findWalletByIdsAndCurrency(ids, currency, session) {
    const doc = await WalletInfo.findOne(
      {
        _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
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

  async deleteTransactionItemByTransactionId(transactionId, session) {
    const deleted = await TransactionItem.findOneAndDelete(
      { transactionId },
      { session }
    );
    return deleted !== null;
  },

  async recordTransaction(input: RecordGroupTransactionInput, session) {
    const [tx] = await TransactionHistory.create(
      [
        {
          transactionType: input.transactionType,
          amountSrc: input.amountSrc,
          currencySource: input.currencySource,
          amountDest: input.amountDest,
          currencyDest: input.currencyDest,
          fromAccount: input.fromAccount,
          toAccount: input.toAccount,
          fromAccountEmail: input.fromAccountEmail,
          toAccountEmail: input.toAccountEmail,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          description: input.description,
        },
      ],
      { session }
    );
    return tx._id.toString();
  },
};
