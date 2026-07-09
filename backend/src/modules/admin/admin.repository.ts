import { getDb } from "../../../lib/db";
import { users, transactionItems, challenges } from "../../db/schema";
import { eq, count } from "drizzle-orm";
import type {
  AdminRequestDocLike,
  AdminUserDoc,
  AdminUserDocLike,
  CreateChallengeInput,
  IAdminRepository,
} from "./admin.types";

export const adminRepository: IAdminRepository = {
  async findUsersPage(skip, limit) {
    const rows = await getDb().select().from(users).offset(skip).limit(limit);
    return rows.map((u) => ({
      _id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      isLocked: u.isLocked,
      isVerified: u.isVerified,
      email: u.email,
      updatedAt: u.updatedAt,
      KYCimg: u.kycImg,
    })) as unknown as AdminUserDocLike[];
  },

  async countUsers() {
    const [r] = await getDb().select({ n: count() }).from(users);
    return r.n;
  },

  async findWithdrawRequestsPage(skip, limit) {
    const rows = await getDb()
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionType, "Withdraw"))
      .offset(skip)
      .limit(limit);
    return rows.map((r) => ({
      _id: r.id,
      name: r.name,
      transactionId: r.transactionId,
      currency: r.currency,
      amount: Number(r.amount),
      userId: r.userId,
    })) as unknown as AdminRequestDocLike[];
  },

  async findUserById(userId) {
    const [row] = await getDb().select().from(users).where(eq(users.id, userId));
    if (!row) return null;
    // Live-doc shim: the service mutates isVerified/isLocked then calls save().
    const doc = {
      ...row,
      _id: row.id,
      isVerified: row.isVerified,
      isLocked: row.isLocked,
      save: async () => {
        await getDb()
          .update(users)
          .set({ isVerified: doc.isVerified, isLocked: doc.isLocked })
          .where(eq(users.id, userId));
      },
    };
    return doc as unknown as AdminUserDoc;
  },

  async createChallenge(input: CreateChallengeInput) {
    const [row] = await getDb()
      .insert(challenges)
      .values({
        category: input.category as (typeof challenges.category.enumValues)[number],
        title: input.title,
        description: input.description,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        exp: input.exp,
        amountToGoal: String(input.amountToGoal),
      })
      .returning();
    return row;
  },

  async findActiveUserIds() {
    // Legacy queried `User.find({ isActive: true })`, a field that never
    // existed on the schema, so this always resolved to an empty set.
    return [];
  },
};
