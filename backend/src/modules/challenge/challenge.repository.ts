import mongoose from "mongoose";
import User from "../../../model/User";
import Challenge from "../../../model/Challenge";
import UserChallengeProgress from "../../../model/UserChallengeProgress";
import WalletInfo from "../../../model/WalletInfo";
import type {
  ChallengeRecord,
  CreateProgressInput,
  IChallengeRepository,
  UpdateProgressPatch,
  UserChallengeProgressRecord,
} from "./challenge.types";

const toChallengeRecord = (doc: {
  _id: unknown;
  title: string;
  description: string;
  exp: number;
  startDate: Date;
  endDate: Date;
  category: string;
  amountToGoal: number;
}): ChallengeRecord => ({
  _id: String(doc._id),
  title: doc.title,
  description: doc.description,
  exp: doc.exp,
  startDate: doc.startDate,
  endDate: doc.endDate,
  category: doc.category,
  amountToGoal: doc.amountToGoal,
});

const toProgressRecord = (doc: {
  _id: unknown;
  userId?: unknown;
  challengeId?: unknown;
  progress: number;
  completed: boolean;
  lastCheckedDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}): UserChallengeProgressRecord => ({
  _id: String(doc._id),
  userId: String(doc.userId),
  challengeId: String(doc.challengeId),
  progress: doc.progress,
  completed: doc.completed,
  lastCheckedDate: doc.lastCheckedDate ?? undefined,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const challengeRepository: IChallengeRepository = {
  async userExists(userId) {
    const doc = await User.findById(userId);
    return !!doc;
  },

  async findActiveChallengesByCategory(category, now) {
    const docs = await Challenge.find({
      category,
      startDate: { $lte: now },
      endDate: { $gt: now },
    });
    return docs.map(toChallengeRecord);
  },

  async findUserWallets(userId) {
    const docs = await WalletInfo.find({ userId });
    return docs.map((doc) => ({
      currency: doc.walletCurrency,
      balance: doc.walletBalance,
    }));
  },

  async findProgress(userId, challengeId) {
    const doc = await UserChallengeProgress.findOne({ userId, challengeId });
    return doc ? toProgressRecord(doc) : null;
  },

  async createProgress(input: CreateProgressInput) {
    const doc = new UserChallengeProgress({
      userId: input.userId,
      challengeId: input.challengeId,
      progress: input.progress,
      completed: input.completed,
      lastCheckedDate: input.lastCheckedDate,
    });
    await doc.save();
    return toProgressRecord(doc);
  },

  async updateProgress(id, patch: UpdateProgressPatch) {
    const doc = await UserChallengeProgress.findById(id);
    if (!doc) {
      throw new Error(`UserChallengeProgress ${id} not found`);
    }
    if (patch.progress !== undefined) {
      doc.progress = patch.progress;
    }
    if (patch.completed !== undefined) {
      doc.completed = patch.completed;
    }
    if (patch.lastCheckedDate !== undefined) {
      doc.lastCheckedDate = patch.lastCheckedDate;
    }
    await doc.save();
    return toProgressRecord(doc);
  },

  async incrementUserExp(userId, exp) {
    await User.findByIdAndUpdate(userId, { $inc: { exp } });
  },

  async countChallenges() {
    return Challenge.countDocuments();
  },

  async findChallengesPage(skip, limit) {
    const docs = await Challenge.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toChallengeRecord);
  },

  async findUserProgressList(userId) {
    const docs = await UserChallengeProgress.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();
    return docs.map(toProgressRecord);
  },
};
