/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOtp } from "./createOtp";
import HTTPError from "http-errors";
import sgMail from '@sendgrid/mail';

export const sendOtpEmail = async (userId: string) => {
  console.log("SEND OTP EMAIL BACKEND CALLED");
  
  if (!userId) {
    throw HTTPError(400, "User Id does not exists");
  }

  const { otp, otpId, userEmail } = await createOtp(userId);
  
  console.log("OTP:", otp);
  console.log("Sending to email:", userEmail);

  if (!userEmail) {
    throw HTTPError(404, 'Email cannot be found');
  }

  if (!process.env.SENDGRID_API_KEY) {
    throw HTTPError(500, "SENDGRID_API_KEY environment variable is missing");
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: userEmail, // Can be any email address
    from: 'finpay.comp3900@gmail.com', // Your verified sender
    subject: 'Your Finpay Verification Code',
    text: `Your verification code is: ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Finpay Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; margin: 20px 0; border-radius: 8px;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const result = await sgMail.send(msg);
    
    console.log("✅ SendGrid email sent successfully");
    console.log("Status:", result[0].statusCode);
    
    return { otpId: otpId };

  } catch (error) {
    console.error("❌ SendGrid error:", error);
    throw HTTPError(500, `Unable to send OTP email: ${(error as any).message}`);
  }
};
