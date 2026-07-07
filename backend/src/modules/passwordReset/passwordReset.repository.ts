import User from "../../../model/User";
import type {
  IPasswordResetRepository,
  InitiateResetResult,
  ResetPasswordCandidate,
  ResetTokenStatus,
} from "./passwordReset.types";

export const passwordResetRepository: IPasswordResetRepository = {
  async initiateReset(email, token, expiryDate): Promise<InitiateResetResult | null> {
    const doc = await User.findOne({ email });
    if (!doc) {
      return null;
    }

    doc.resetPasswordToken = token;
    doc.resetPasswordTokenExpiryDate = expiryDate;
    await doc.save();

    return { email: doc.email };
  },

  async findByResetToken(token): Promise<ResetTokenStatus | null> {
    const doc = await User.findOne({ resetPasswordToken: token });
    if (!doc) {
      return null;
    }

    return {
      resetPasswordToken: doc.resetPasswordToken,
      resetPasswordTokenExpiryDate: doc.resetPasswordTokenExpiryDate,
    };
  },

  async findValidResetCandidate(token): Promise<ResetPasswordCandidate | null> {
    const doc = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiryDate: { $gt: Date.now() },
    });
    if (!doc) {
      return null;
    }

    return {
      password: doc.password,
      existingPassword: doc.existingPassword,
      ref: doc,
    };
  },

  async finalizeReset(candidate, hashedPassword) {
    const doc = candidate.ref as {
      existingPassword: string[];
      password: string;
      resetPasswordToken?: string;
      resetPasswordTokenExpiryDate?: number;
      save: () => Promise<unknown>;
    };

    doc.existingPassword.push(doc.password);
    doc.password = hashedPassword;
    doc.resetPasswordToken = undefined;
    doc.resetPasswordTokenExpiryDate = undefined;
    await doc.save();

    return doc;
  },
};
