/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOtp } from "./createOtp";
import HTTPError from "http-errors";
import nodemailer from "nodemailer";

export const sendOtpEmail = async (userId: string) => {
  console.log("SEND OTP EMAIL BACKEND CALLED");
  
  if (!userId) {
    throw HTTPError(400, "User Id does not exists");
  }

  const { otp, otpId, userEmail } = await createOtp(userId);
  
  console.log(otp, otpId, userEmail);

  if (!userEmail) {
    throw HTTPError(404, 'Email cannot be found');
  }

  // Check for Brevo credentials
  if (!process.env.BREVO_API_KEY) {
    throw HTTPError(500, "BREVO_EMAIL or BREVO_PASSWORD environment variable is missing");
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: "96cc07001@smtp-brevo.com",
      pass: process.env.BREVO_API_KEY,
    },
    connectionTimeout: 60000,
    socketTimeout: 60000,
  });

  try {
    const result = await transporter.sendMail({
      from: '96cc07001@smtp-brevo.com',
      to: userEmail,
      subject: '6 Digits OTP from Finpay',
      text: `Your otp number is ${otp}`,
    });

    console.log("OTP email sent successfully to:", userEmail);
    console.log("Brevo result:", result);
    return { otpId: otpId };

  } catch (error) {
    console.error("Brevo email error:", error);
    throw HTTPError(500, `Unable to send OTP email: ${(error as any).message}`);
  }
};