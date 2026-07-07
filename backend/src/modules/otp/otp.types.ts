export interface OtpUserRecord {
  id: string;
  email: string;
}

export interface CreateOtpRecordResult {
  otpId: string;
}

export interface OtpRecord {
  otp: string;
  expiredAt: Date;
}

export interface CreateOtpResult {
  otp: string;
  otpId: string;
  userEmail: string;
}

export interface SendOtpEmailResult {
  otpId: string;
}

export interface VerifyOtpResult {
  success: true;
  token: string;
  userId: string;
}

export interface IOtpRepository {
  findUserById(userId: string): Promise<OtpUserRecord | null>;
  createOtpRecord(
    userId: string,
    hashedOtp: string,
    expiredAt: Date
  ): Promise<CreateOtpRecordResult>;
  findOtpById(otpId: string): Promise<OtpRecord | null>;
  /** Fire-and-forget, mirroring the legacy un-awaited `User.findByIdAndUpdate` call. */
  appendUserToken(userId: string, token: string): void;
}

export interface OtpServiceDeps {
  repo: IOtpRepository;
}
