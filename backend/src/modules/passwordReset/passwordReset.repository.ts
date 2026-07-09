import { getDb } from "../../../lib/db";
import { users } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type {
  IPasswordResetRepository,
  InitiateResetResult,
  ResetPasswordCandidate,
  ResetTokenStatus,
} from "./passwordReset.types";

export const passwordResetRepository: IPasswordResetRepository = {
  async initiateReset(email, token, expiryDate): Promise<InitiateResetResult | null> {
    const [u] = await getDb().select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email));
    if (!u) return null;
    await getDb()
      .update(users)
      .set({ resetPasswordToken: token, resetPasswordTokenExpiryDate: String(expiryDate) })
      .where(eq(users.id, u.id));
    return { email: u.email };
  },

  async findByResetToken(token): Promise<ResetTokenStatus | null> {
    const [u] = await getDb()
      .select({
        resetPasswordToken: users.resetPasswordToken,
        resetPasswordTokenExpiryDate: users.resetPasswordTokenExpiryDate,
      })
      .from(users)
      .where(eq(users.resetPasswordToken, token));
    if (!u) return null;
    return {
      resetPasswordToken: u.resetPasswordToken,
      resetPasswordTokenExpiryDate:
        u.resetPasswordTokenExpiryDate != null ? Number(u.resetPasswordTokenExpiryDate) : null,
    };
  },

  async findValidResetCandidate(token): Promise<ResetPasswordCandidate | null> {
    const [u] = await getDb()
      .select({ id: users.id, password: users.password, existingPassword: users.existingPassword })
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          sql`${users.resetPasswordTokenExpiryDate} > ${Date.now()}`
        )
      );
    if (!u) return null;
    return { password: u.password, existingPassword: u.existingPassword, ref: u.id };
  },

  async finalizeReset(candidate, hashedPassword) {
    const userId = candidate.ref as string;
    // Push the old password onto existing_password, set the new one, clear token.
    await getDb()
      .update(users)
      .set({
        existingPassword: sql`array_append(${users.existingPassword}, ${candidate.password})`,
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiryDate: null,
      })
      .where(eq(users.id, userId));
    const [updated] = await getDb().select().from(users).where(eq(users.id, userId));
    return updated;
  },
};
