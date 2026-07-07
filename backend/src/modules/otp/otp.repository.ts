import Otp from "../../../model/Otp";
import User from "../../../model/User";
import type {
  CreateOtpRecordResult,
  IOtpRepository,
  OtpRecord,
  OtpUserRecord,
} from "./otp.types";

export const otpRepository: IOtpRepository = {
  async findUserById(userId): Promise<OtpUserRecord | null> {
    const doc = await User.findById(userId);
    if (!doc) {
      return null;
    }

    return { id: String(doc._id), email: doc.email };
  },

  async createOtpRecord(
    userId,
    hashedOtp,
    expiredAt
  ): Promise<CreateOtpRecordResult> {
    const newOtp = await Otp.create({
      userId,
      otp: hashedOtp,
      expiredAt,
    });

    return { otpId: newOtp._id.toString() };
  },

  async findOtpById(otpId): Promise<OtpRecord | null> {
    const doc = await Otp.findById(otpId);
    if (!doc) {
      return null;
    }

    return { otp: doc.otp, expiredAt: doc.expiredAt };
  },

  appendUserToken(userId, token) {
    // Not awaited: mirrors the legacy fire-and-forget behavior exactly.
    User.findByIdAndUpdate(userId, { $push: { tokens: token } });
  },
};
