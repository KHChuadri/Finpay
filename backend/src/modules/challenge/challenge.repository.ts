import { getDb } from "../../../lib/db";
import { users, challenges, userChallengeProgress, wallets } from "../../db/schema";
import { eq, and, lte, gt, desc, count, sql } from "drizzle-orm";
import type {
  ChallengeRecord,
  CreateProgressInput,
  IChallengeRepository,
  UpdateProgressPatch,
  UserChallengeProgressRecord,
} from "./challenge.types";

type ChallengeRow = typeof challenges.$inferSelect;
type ProgressRow = typeof userChallengeProgress.$inferSelect;

const toChallengeRecord = (r: ChallengeRow): ChallengeRecord => ({
  _id: r.id,
  title: r.title,
  description: r.description,
  exp: r.exp,
  startDate: r.startDate,
  endDate: r.endDate,
  category: r.category,
  amountToGoal: Number(r.amountToGoal),
});

const toProgressRecord = (r: ProgressRow): UserChallengeProgressRecord => ({
  _id: r.id,
  userId: String(r.userId),
  challengeId: String(r.challengeId),
  progress: Number(r.progress),
  completed: r.completed,
  lastCheckedDate: r.lastCheckedDate ?? undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export const challengeRepository: IChallengeRepository = {
  async userExists(userId) {
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId));
    return !!u;
  },

  async findActiveChallengesByCategory(category, now) {
    const rows = await getDb()
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.category, category as ChallengeRow["category"]),
          lte(challenges.startDate, now),
          gt(challenges.endDate, now)
        )
      );
    return rows.map(toChallengeRecord);
  },

  async findUserWallets(userId) {
    const rows = await getDb()
      .select({ currency: wallets.walletCurrency, balance: wallets.walletBalance })
      .from(wallets)
      .where(eq(wallets.userId, userId));
    return rows.map((r) => ({ currency: r.currency, balance: Number(r.balance) }));
  },

  async findProgress(userId, challengeId) {
    const [r] = await getDb()
      .select()
      .from(userChallengeProgress)
      .where(
        and(
          eq(userChallengeProgress.userId, userId),
          eq(userChallengeProgress.challengeId, challengeId)
        )
      );
    return r ? toProgressRecord(r) : null;
  },

  async createProgress(input: CreateProgressInput) {
    const [r] = await getDb()
      .insert(userChallengeProgress)
      .values({
        userId: input.userId,
        challengeId: input.challengeId,
        progress: String(input.progress),
        completed: input.completed,
        lastCheckedDate: input.lastCheckedDate,
      })
      .returning();
    return toProgressRecord(r);
  },

  async updateProgress(id, patch: UpdateProgressPatch) {
    const set: Partial<ProgressRow> = {};
    if (patch.progress !== undefined) set.progress = String(patch.progress);
    if (patch.completed !== undefined) set.completed = patch.completed;
    if (patch.lastCheckedDate !== undefined) set.lastCheckedDate = patch.lastCheckedDate;
    const [r] = await getDb()
      .update(userChallengeProgress)
      .set(set)
      .where(eq(userChallengeProgress.id, id))
      .returning();
    if (!r) throw new Error(`UserChallengeProgress ${id} not found`);
    return toProgressRecord(r);
  },

  async incrementUserExp(userId, exp) {
    await getDb()
      .update(users)
      .set({ exp: sql`${users.exp} + ${exp}` })
      .where(eq(users.id, userId));
  },

  async countChallenges() {
    const [r] = await getDb().select({ n: count() }).from(challenges);
    return r.n;
  },

  async findChallengesPage(skip, limit) {
    const rows = await getDb()
      .select()
      .from(challenges)
      .orderBy(desc(challenges.createdAt))
      .offset(skip)
      .limit(limit);
    return rows.map(toChallengeRecord);
  },

  async findUserProgressList(userId) {
    const rows = await getDb()
      .select()
      .from(userChallengeProgress)
      .where(eq(userChallengeProgress.userId, userId));
    return rows.map(toProgressRecord);
  },
};
