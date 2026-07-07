import HTTPError from "http-errors";
import User, { UserType } from "../../../model/User";
import RequestModel from "../../../model/Request";
import WalletInfo from "../../../model/WalletInfo";
import TransactionHistory from "../../../model/TransactionHistory";
import type {
  CreateRequestInput,
  IRequestRepository,
  RequestListItem,
  RequestRecord,
  SavedRecipient,
  UserBasic,
} from "./request.types";

const toUserBasic = (doc: { _id: unknown; email: string }): UserBasic => ({
  id: String(doc._id),
  email: doc.email,
});

const toRequestRecord = (doc: {
  _id: unknown;
  userId: unknown;
  senderEmail: string;
  currency: string;
  amount: number;
  notes: string;
  date: Date;
}): RequestRecord => ({
  id: String(doc._id),
  userId: String(doc.userId),
  senderEmail: doc.senderEmail,
  currency: doc.currency,
  amount: doc.amount,
  notes: doc.notes,
  date: doc.date,
});

const toRequestListItem = (doc: {
  _id: unknown;
  senderEmail: string;
  date: Date;
  amount: number;
  currency: string;
  notes: string;
}): RequestListItem => ({
  requestId: String(doc._id),
  senderEmail: doc.senderEmail,
  requestDate: doc.date,
  amount: doc.amount,
  currency: doc.currency,
  notes: doc.notes,
});

export const requestRepository: IRequestRepository = {
  async findUserById(id) {
    const doc = await User.findById(id);
    return doc ? toUserBasic(doc) : null;
  },

  async findUserByEmail(email) {
    const doc = await User.findOne({ email });
    return doc ? toUserBasic(doc) : null;
  },

  async createRequestForRecipient(input: CreateRequestInput) {
    const newRequest = await RequestModel.create({
      userId: input.recipientUserId,
      senderEmail: input.senderEmail,
      currency: input.currency,
      amount: input.amount,
      notes: input.notes,
      date: new Date(),
    });

    const recipient = await User.findOne({ email: input.recipientEmail });
    if (!recipient) {
      throw HTTPError(404, "Recipient not found.");
    }
    recipient.request.push(newRequest._id);
    await recipient.save();

    return newRequest._id.toString();
  },

  async findUserWithRequestIds(userId) {
    const doc = await User.findById(userId);
    if (!doc) {
      return null;
    }
    return {
      id: String(doc._id),
      requestIds: doc.request.map((id) => String(id)),
    };
  },

  async findRequestsByIds(ids) {
    const docs = await RequestModel.find({ _id: { $in: ids } });
    return docs.map(toRequestListItem);
  },

  async findRequestById(requestId) {
    const doc = await RequestModel.findById(requestId);
    return doc ? toRequestRecord(doc) : null;
  },

  async findWalletByUserId(userId) {
    const doc = await WalletInfo.findOne({ userId });
    return doc ? { id: String(doc._id) } : null;
  },

  async findWalletsByUserAndCurrency(userId, currency) {
    const docs = await WalletInfo.find({ userId, walletCurrency: currency });
    return docs.map((doc) => ({ id: String(doc._id) }));
  },

  async deleteRequestAndUnlink(requestId, userId) {
    await RequestModel.findByIdAndDelete(requestId);
    await User.findByIdAndUpdate(userId, { $pull: { request: requestId } });
  },

  async findSavedRecipients(userId) {
    const transactionSent = await TransactionHistory.find({
      fromAccount: userId,
    }).populate<{ toAccount: UserType }>("toAccount");

    const savedRecipient: SavedRecipient[] = transactionSent.map(
      (transaction) => ({
        email: transaction.toAccountEmail,
        firstName: transaction.toAccount.firstName,
        lastName: transaction.toAccount.lastName,
      })
    );

    // Only return unique recipients (by email), matching legacy dedupe.
    const savedRecipientSet = new Set(savedRecipient.map((r) => r.email));
    const uniqueRecipientList: SavedRecipient[] = [];
    savedRecipientSet.forEach((email) => {
      const recipient = savedRecipient.find((r) => r.email === email);
      if (recipient) {
        uniqueRecipientList.push(recipient);
      }
    });

    return uniqueRecipientList;
  },

  async findRecipientInfo(email, userId) {
    const doc =
      email !== "SELF"
        ? await User.findOne({ email })
        : await User.findById(userId);

    if (!doc) {
      return null;
    }

    return { email: doc.email, walletInfo: doc.walletInfo };
  },
};
