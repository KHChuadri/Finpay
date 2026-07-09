import { getDb } from "../../../lib/db";
import { users, otps } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import type {
  CreateOtpRecordResult,
  IOtpRepository,
  OtpRecord,
  OtpUserRecord,
} from "./otp.types";

export const otpRepository: IOtpRepository = {
  async findUserById(userId): Promise<OtpUserRecord | null> {
    const [u] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    return u ? { id: u.id, email: u.email } : null;
  },

  async createOtpRecord(userId, hashedOtp, expiredAt): Promise<CreateOtpRecordResult> {
    const [r] = await getDb()
      .insert(otps)
      .values({ userId, otp: hashedOtp, expiredAt })
      .returning({ id: otps.id });
    return { otpId: r.id };
  },

  async findOtpById(otpId): Promise<OtpRecord | null> {
    const [r] = await getDb().select().from(otps).where(eq(otps.id, otpId));
    return r ? { otp: r.otp, expiredAt: r.expiredAt } : null;
  },

  appendUserToken(userId, token) {
    // Fire-and-forget, mirroring the legacy un-awaited update.
    void getDb()
      .update(users)
      .set({ tokens: sql`array_append(${users.tokens}, ${token})` })
      .where(eq(users.id, userId))
      .catch(() => {});
  },
};
