/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import HTTPError from "http-errors";
import { Resend } from "resend";
import type {
  CreateOtpResult,
  OtpServiceDeps,
  SendOtpEmailResult,
  VerifyOtpResult,
} from "./otp.types";

export const createOtpService = (deps: OtpServiceDeps) => {
  const { repo } = deps;

  const createOtp = async (userId: string): Promise<CreateOtpResult> => {
    console.log("CREATE OTP CALLED");

    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User does not exists");
    }

    // Generate a new otp
    const buffer = crypto.randomBytes(32);
    let otp = (
      parseInt(crypto.createHash("sha256").update(buffer).digest("hex"), 16) %
      1000000
    )
      .toString()
      .slice(0, 6);

    // Make sure that otp always have length 6
    while (otp.length !== 6) {
      otp = (
        parseInt(
          crypto.createHash("sha256").update(buffer).digest("hex"),
          16
        ) % 1000000
      )
        .toString()
        .slice(0, 6);
    }

    // Hashed function to hash otp
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Set expired time to be a minute after created time
    const expiredTime = new Date(Date.now() + 60 * 1000);

    const { otpId } = await repo.createOtpRecord(
      user.id,
      hashedOtp,
      expiredTime
    );

    console.log("CREATE_OTP RETURNING");

    return {
      otp,
      otpId,
      userEmail: user.email,
    };
  };

  const sendOtpEmail = async (userId: string): Promise<SendOtpEmailResult> => {
    console.log("SEND OTP EMAIL BACKEND CALLED");

    if (!userId) {
      throw HTTPError(400, "User Id does not exists");
    }

    const { otp, otpId, userEmail } = await createOtp(userId);

    console.log("OTP:", otp);
    console.log("Sending to email:", userEmail);

    if (!userEmail) {
      throw HTTPError(404, "Email cannot be found");
    }

    if (!process.env.RESEND_API_KEY) {
      throw HTTPError(500, "RESEND_API_KEY environment variable is missing");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    // Must be a Resend-verified domain; onboarding@resend.dev works for testing.
    const from = process.env.OTP_FROM_EMAIL || "Finpay <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from,
      to: userEmail,
      subject: "Your Finpay Verification Code",
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
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw HTTPError(500, `Unable to send OTP email: ${error.message}`);
    }

    console.log("✅ Resend email sent successfully. Id:", data?.id);
    return { otpId };
  };

  const verifyOtp = async (
    otpId: string,
    otp: number,
    userId: string,
    email: string
  ): Promise<VerifyOtpResult> => {
    console.log("VERIFY OTP BE CALLED");

    if (!otpId) {
      throw HTTPError(400, "OTP does not exist");
    }

    const findOtp = await repo.findOtpById(otpId);

    if (!findOtp) {
      throw HTTPError(400, "No OTP has been send");
    }

    if (findOtp.expiredAt < new Date()) {
      throw HTTPError(404, "OTP code has expired");
    }

    // Hash the otp being input by user
    const hashedOtp = crypto.createHash("sha256").update(otp.toString()).digest("hex");

    if (hashedOtp !== findOtp.otp) {
      throw HTTPError(404, "Incorrect OTP number");
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ email: email, userId: userId }, secret);

    // Update user's token
    repo.appendUserToken(userId, token);

    return {
      success: true,
      token,
      userId,
    };
  };

  return { createOtp, sendOtpEmail, verifyOtp };
};
