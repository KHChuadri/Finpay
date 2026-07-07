import { otpService } from "../modules/otp/otp.container";

/**
 * <Verify if otp entered is correct>
 *
 * @param {string} otpId
 * @param {number} otp
 * @param {string} userId
 * @param {string} email
 * @returns { success: boolean, token: string, userId: string } object containing user session tokens, status, and id
 */
export const verifyOtp = async (
  otpId: string,
  otp: number,
  userId: string,
  email: string
) => {
  return otpService.verifyOtp(otpId, otp, userId, email);
};
