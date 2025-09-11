import nodemailer from "nodemailer";
import { createOtp } from "./createOtp";
import HTTPError from "http-errors";

/**
 * <Sends a OTP Email to user's registered email>
 * 
 * @param {string} userId  
 * @returns {otpId: string} object containing the otpid that was sent
 */
export const sendOtpEmail = async (userId: string) => {
  console.log("SEND OTP EMAIL BE CALLED");
  if (!userId) {
    throw HTTPError(400, "User Id does not exists");
  }

  const { otp, otpId, userEmail } = await createOtp(userId);
  if (!userEmail) {
    throw HTTPError(404, 'Email cannot be found');
  }

  // Verify APP_PASSWORD exists
  if (!process.env.APP_PASSWORD) {
    throw HTTPError(500, "Email configuration missing");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "finpay.comp3900@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
    // Add timeout and connection settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
  });

  const mailOptions = {
    from: "finpay.comp3900@gmail.com",
    to: userEmail,
    subject: "6 Digits OTP from Finpay",
    text: `Your otp number is ${otp}.`,
  };

  try {
    // Use Promise version (no callback) with timeout
    await Promise.race([
      transporter.sendMail(mailOptions), // This returns a Promise when no callback is provided
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), 10000)
      ),
    ]);

    console.log("OTP email sent successfully to:", userEmail);
    return { otpId: otpId };

  } catch (error) {
    console.error("Email sending error:", error);
    throw HTTPError(500, "Unable to send otp number to your email");
  }
};