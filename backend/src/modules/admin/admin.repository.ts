import mongoose from "mongoose";
import User from "../../../model/User";
import TransactionItem from "../../../model/TransactionItem";
import Challenge from "../../../model/Challenge";
import type {
  AdminRequestDocLike,
  AdminUserDoc,
  AdminUserDocLike,
  CreateChallengeInput,
  IAdminRepository,
} from "./admin.types";

export const adminRepository: IAdminRepository = {
  async findUsersPage(skip, limit) {
    const docs = await User.find()
      .populate("bioData", "firstName lastName")
      .skip(skip)
      .limit(limit);
    return docs as unknown as AdminUserDocLike[];
  },

  async countUsers() {
    return User.countDocuments();
  },

  async findWithdrawRequestsPage(skip, limit) {
    const docs = await TransactionItem.find({ transactionType: "Withdraw" })
      .limit(limit)
      .skip(skip);
    return docs as unknown as AdminRequestDocLike[];
  },

  async findUserById(userId) {
    const doc = await User.findById(new mongoose.Types.ObjectId(userId));
    return doc as unknown as AdminUserDoc | null;
  },

  async createChallenge(input: CreateChallengeInput) {
    return Challenge.create({
      category: input.category,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      exp: input.exp,
      amountToGoal: input.amountToGoal,
    });
  },

  async findActiveUserIds() {
    const docs = await User.find({ isActive: true });
    return docs.map((doc) => String(doc._id));
  },
};
