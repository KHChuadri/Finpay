import User from "../../../model/User";
import WalletInfo, { WalletInfoType } from "../../../model/WalletInfo";
import type {
  IWalletRepository,
  UserWithWallets,
  WalletRecord,
} from "./wallet.types";

const toWalletRecord = (doc: {
  _id: unknown;
  userId: unknown;
  walletBalance: number;
  walletCurrency: string;
}): WalletRecord => ({
  id: String(doc._id),
  userId: String(doc.userId),
  walletBalance: doc.walletBalance,
  walletCurrency: doc.walletCurrency,
});

export const walletRepository: IWalletRepository = {
  async findUserById(userId) {
    const doc = await User.findById(userId);
    return doc ? { id: String(doc._id) } : null;
  },

  async findUserWithWallets(userId): Promise<UserWithWallets | null> {
    const doc = await User.findById(userId)
      .populate<{ walletInfo: WalletInfoType[] }>("walletInfo")
      .lean();

    if (!doc) {
      return null;
    }

    return {
      id: String(doc._id),
      wallets: doc.walletInfo,
    };
  },

  async findWalletsByUserId(userId) {
    return WalletInfo.find({ userId }).lean();
  },

  async findWallet(userId, currency) {
    const doc = await WalletInfo.findOne({
      userId,
      walletCurrency: currency,
    });
    return doc ? toWalletRecord(doc) : null;
  },

  async createWallet(userId, currency) {
    const doc = new WalletInfo({
      userId,
      walletBalance: 0,
      walletCurrency: currency,
    });
    await doc.save();

    await User.updateOne({ _id: userId }, { $push: { walletInfo: doc._id } });

    return toWalletRecord(doc);
  },

  async deleteWalletById(walletId) {
    const deleted = await WalletInfo.findByIdAndDelete(walletId);
    return deleted != null;
  },
};
