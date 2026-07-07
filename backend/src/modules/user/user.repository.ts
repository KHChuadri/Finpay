import User from "../../../model/User";
import TransactionHistory from "../../../model/TransactionHistory";
import type {
  IUserRepository,
  UserAdminRecord,
  UserRankRecord,
  UserWithTransactionHistory,
} from "./user.types";

export const userRepository: IUserRepository = {
  async findUserRankById(userId): Promise<UserRankRecord | null> {
    const doc = await User.findById(userId);
    return doc ? { id: String(doc._id), rank: doc.rank } : null;
  },

  async findUserAdminById(userId): Promise<UserAdminRecord | null> {
    const doc = await User.findById(userId);
    return doc ? { id: String(doc._id), isAdmin: doc.isAdmin } : null;
  },

  async findUserWithTransactionHistory(
    userId
  ): Promise<UserWithTransactionHistory | null> {
    const doc = await User.findById(userId);
    if (!doc) {
      return null;
    }
    return {
      id: String(doc._id),
      transactionHistory: doc.transactionHistory.map((id) => String(id)),
    };
  },

  async findTransactionHistoryByIds(ids) {
    return TransactionHistory.find({ _id: { $in: ids } }).lean();
  },
};
