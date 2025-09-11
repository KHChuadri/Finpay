/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOtp } from "./createOtp";
import HTTPError from "http-errors";
import { Resend } from "resend";

export const sendOtpEmail = async (userId: string) => {
  console.log("SEND OTP EMAIL BACKEND CALLED");
  
  if (!userId) {
    throw HTTPError(400, "User Id does not exists");
  }

  const { otp, otpId, userEmail } = await createOtp(userId);
  if (!userEmail) {
    throw HTTPError(404, 'Email cannot be found');
  }

  // Check for RESEND_API_KEY instead of APP_PASSWORD
  if (!process.env.RESEND_API_KEY) {
    throw HTTPError(500, "RESEND_API_KEY environment variable is missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // ADD AWAIT HERE - this was missing!
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: '6 Digits OTP from Finpay',
      text: `Your otp number is ${otp}`
    });

    console.log("OTP email sent successfully to:", userEmail);
    console.log("Resend result:", result);
    return { otpId: otpId };

  } catch (error) {
    console.error("Resend email error:", error);
    throw HTTPError(500, `Unable to send OTP email: ${(error as any).message}`);
  }
};