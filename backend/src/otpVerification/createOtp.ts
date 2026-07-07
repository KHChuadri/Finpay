import { otpService } from "../modules/otp/otp.container";

/**
 * Generate a new OTP for Login and High-value Transaction
 *
 * @param {string} userId
 * @returns {otp: string, otpId: string, userEmail: string} object containing otp information
 */
export const createOtp = async (userId: string) => {
  return otpService.createOtp(userId);
};
