export interface PasswordResetServiceDeps {
  repo: IPasswordResetRepository;
}

export interface InitiateResetResult {
  email: string;
}

export interface ResetTokenStatus {
  resetPasswordToken?: string | null;
  resetPasswordTokenExpiryDate?: number | null;
}

/**
 * Opaque handle back to the live Mongoose document found for a reset-password
 * candidate. Only `finalizeReset` (repository) dereferences `ref`; the service
 * treats it as a capability it forwards, never inspects.
 */
export interface ResetPasswordCandidate {
  password: string;
  existingPassword: string[];
  ref: unknown;
}

export interface SendPasswordResetEmailResult {
  success: true;
  message: string;
}

export interface ResetPasswordTokenResult {
  success: true;
}

export interface ResetPasswordResult {
  success: true;
  user: unknown;
}

export interface IPasswordResetRepository {
  /** Finds the user by email, sets the reset token/expiry, and saves. Returns null if no such user. */
  initiateReset(
    email: string,
    token: string,
    expiryDate: number
  ): Promise<InitiateResetResult | null>;
  findByResetToken(token: string): Promise<ResetTokenStatus | null>;
  findValidResetCandidate(token: string): Promise<ResetPasswordCandidate | null>;
  /** Mutates the candidate's backing document with the new password and clears the token, then saves. Returns the saved user. */
  finalizeReset(
    candidate: ResetPasswordCandidate,
    hashedPassword: string
  ): Promise<unknown>;
}
