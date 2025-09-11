import Otp from "../../model/Otp";
import User from "../../model/User";
import HTTPError from "http-errors";
import crypto from "crypto";

/**
 * Generate a new OTP for Login and High-value Transaction
 * 
 * @param {string} userId 
 * @returns {otp: string, otpId: string, userEmail: string} object containing otp information
 */
export const createOtp = async (userId: string) => {
  console.log("CREATE OTP CALLED")
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw HTTPError(404, "User does not exists");
  }

  // Generate a new otp
  const buffer = crypto.randomBytes(32);
  let otp = (parseInt(crypto.createHash("sha256").update(buffer).digest("hex"), 16) % 1000000).toString().slice(0,6);

  // Make sure that otp always have length 6
  while (otp.length !== 6) {
    otp = (parseInt(crypto.createHash("sha256").update(buffer).digest("hex"), 16) % 1000000).toString().slice(0,6);
  }

  // Hashed function to hash otp
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")

  // Set expired time to be a minute after created time
  const expiredTime = new Date(Date.now() + 60 * 1000);

  // Create new otp
  const newOtp = await Otp.create({
    userId: user._id,
    otp: hashedOtp,
    expiredAt: expiredTime
  })

  const otpId = newOtp._id;

  return {
    otp: otp,
    otpId: otpId.toString(),
    userEmail: user.email
  }
}