import { otpService } from "../modules/otp/otp.container";

export const sendOtpEmail = async (userId: string) => {
  return otpService.sendOtpEmail(userId);
};
