import mongoose from "mongoose";
import ScheduledPayment, {
  ScheduledPaymentType,
} from "../../../model/ScheduledPayment";
import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import type {
  IScheduledPaymentRepository,
  UserBasic,
} from "./scheduledPayment.types";

const toUserBasic = (doc: { _id: unknown; email: string }): UserBasic => ({
  id: String(doc._id),
  email: doc.email,
});

export const scheduledPaymentRepository: IScheduledPaymentRepository = {
  async findUserById(id) {
    const doc = await User.findById(id);
    return doc ? toUserBasic(doc) : null;
  },

  async findUserByEmail(email) {
    const doc = await User.findOne({ email });
    return doc ? toUserBasic(doc) : null;
  },

  async createPayment(input) {
    const doc = await ScheduledPayment.create({
      debtorId: input.debtorId,
      creditorId: input.creditorId,
      amountSrc: input.amountSrc,
      amountDest: input.amountDest,
      currencySrc: input.currencySrc,
      currencyDest: input.currencyDest,
      scheduledDate: input.scheduledDate,
    });

    return {
      id: doc._id.toString(),
      debtorId: String(doc.debtorId),
      creditorId: String(doc.creditorId),
    };
  },

  async updateJobId(paymentId, jobId) {
    await ScheduledPayment.findByIdAndUpdate(
      paymentId,
      { jobId },
      { new: true }
    );
  },

  async findWalletByUserAndCurrency(userId, currency) {
    const doc = await WalletInfo.findOne({
      userId,
      walletCurrency: currency,
    });
    return doc
      ? { id: String(doc._id), walletBalance: doc.walletBalance }
      : null;
  },

  async debitWalletById(walletId, amount) {
    const doc = await WalletInfo.findById(walletId);
    if (!doc) {
      return;
    }
    doc.walletBalance -= amount;
    await doc.save();
  },

  async findPaymentById(paymentId) {
    const doc = await ScheduledPayment.findById(paymentId);
    if (!doc) {
      return null;
    }
    return {
      id: String(doc._id),
      debtorId: String(doc.debtorId),
      status: doc.status ?? "pending",
      jobId: doc.jobId ?? undefined,
      amountSrc: doc.amountSrc,
      currencySrc: doc.currencySrc,
    };
  },

  async deletePaymentById(paymentId) {
    await ScheduledPayment.findByIdAndDelete(paymentId);
  },

  async creditWallet(userId, currency, amount) {
    await WalletInfo.findOneAndUpdate(
      { userId, walletCurrency: currency },
      { $inc: { walletBalance: amount } }
    );
  },

  async countPaymentsByDebtor(userId) {
    return ScheduledPayment.countDocuments({
      debtorId: new mongoose.Types.ObjectId(userId),
    });
  },

  async findPendingPaymentsByDebtor(userId, skip, limit) {
    const docs = await ScheduledPayment.find({
      debtorId: new mongoose.Types.ObjectId(userId),
      status: "pending",
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return docs.map((doc: ScheduledPaymentType) => ({
      id: String(doc._id),
      debtorId: String(doc.debtorId),
      creditorId: String(doc.creditorId),
      amountSrc: doc.amountSrc,
      amountDest: doc.amountDest,
      currencySrc: doc.currencySrc,
      currencyDest: doc.currencyDest,
      scheduledDate: doc.scheduledDate,
    }));
  },
};
