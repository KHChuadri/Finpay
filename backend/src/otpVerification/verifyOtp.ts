import Otp from "../../model/Otp";
import HTTPError from "http-errors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../../model/User";

/**
 * <Verify if otp entered is correct>
 * 
 * @param {string} otpId 
 * @param {number} otp 
 * @param {string} userId 
 * @param {string} email 
 * @returns { success: boolean, token: string, userId: string } object containing user session tokens, status, and id
 */
export const verifyOtp = async (otpId: string, otp: number, userId: string, email: string) => {
  console.log("VERIFY OTP BE CALLED");
  if (!otpId) {
    throw HTTPError(400, "OTP does not exist");
  }

  const findOtp = await Otp.findById(otpId);

  if (!findOtp) {
    throw HTTPError(400, "No OTP has been send");
  }

  if (findOtp.expiredAt < new Date()) {
    throw HTTPError(404, "OTP code has expired");
  }

  // Hash the otp being input by user
  const hashedOtp = crypto.createHash("sha256").update(otp.toString()).digest("hex")

  if (hashedOtp !== findOtp.otp) {
    throw HTTPError(404, "Incorrect OTP number");
  } 

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ email: email, userId: userId }, secret);

  // Update user's token
  User.findByIdAndUpdate(
    userId,
    {
      $push: { tokens: token }
    }
  );

  return { 
    success: true,
    token,
    userId
  }
}

