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

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "finpay.comp3900@gmail.com",
      pass: process.env.APP_PASSWORD!,
    },
  });

  const mailOptions = {
    from: "finpay.comp3900@gmail.com",
    to: userEmail,
    subject: "6 Digits OTP from Finpay",
    text: `Your otp number is ${otp}.`,
  };

  await Promise.race([
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        throw HTTPError(500, "Unable to send otp number to your email");
      }
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timeout")), 5000)
    ),
  ]);

  return { otpId: otpId };
};
