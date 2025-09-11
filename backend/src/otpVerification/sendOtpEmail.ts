/* eslint-disable @typescript-eslint/no-explicit-any */
// import nodemailer from "nodemailer";
import { createOtp } from "./createOtp";
import HTTPError from "http-errors";
import { Resend } from "resend";
import dotenv from "dotenv";

export const sendOtpEmail = async (userId: string) => {
  console.log("SEND OTP EMAIL BE CALLED");
  dotenv.config();
  if (!userId) {
    throw HTTPError(400, "User Id does not exists");
  }

  const { otp, otpId, userEmail } = await createOtp(userId);
  if (!userEmail) {
    throw HTTPError(404, 'Email cannot be found');
  }

  // Verify APP_PASSWORD exists
  if (!process.env.APP_PASSWORD) {
    throw HTTPError(500, "APP_PASSWORD environment variable is missing");
  }

  
  const resend = new Resend(process.env.RESEND_API_KEY);

  resend.emails.send({
    from: 'onboarding@resend.dev',
    to: userEmail,
    subject: '6 Digits OTP from Finpay',
    text: `Your otp number is ${otp}`
  });

    console.log("OTP email sent successfully to:", userEmail);
    return { otpId: otpId };

  // // Use explicit SMTP config instead of service: "gmail"
  // const transporter = nodemailer.createTransport({
  //   host: 'mail.smtp2go.com',
  //   port: 2525,
  //   secure: false, // Use STARTTLS
  //   requireTLS: true,
  //   auth: {
  //     user: "finpay.comp3900@gmail.com",
  //     pass: process.env.APP_PASSWORD,
  //   },
  //   // Critical timeout settings
  //   connectionTimeout: 60000,  // 1 minute
  //   greetingTimeout: 30000,    // 30 seconds  
  //   socketTimeout: 60000,      // 1 minute
  //   dnsTimeout: 30000,         // 30 seconds
  //   // Enable debugging
  //   debug: true,
  //   logger: true
  // });

  // const mailOptions = {
  //   from: "finpay.comp3900@gmail.com",
  //   to: userEmail,
  //   subject: "6 Digits OTP from Finpay",
  //   text: `Your otp number is ${otp}.`,
  // };

  // try {
  //   // Test connection first
  //   await transporter.verify();
  //   console.log("SMTP connection verified successfully");

  //   // Send email with longer timeout
  //   await Promise.race([
  //     transporter.sendMail(mailOptions),
  //     new Promise((_, reject) =>
  //       setTimeout(() => reject(new Error("Email timeout after 60 seconds")), 60000)
  //     ),
  //   ]);

  //   console.log("OTP email sent successfully to:", userEmail);
  //   return { otpId: otpId };

  // } catch (error) {
  //   console.error("Detailed email error:", {
  //     message: (error as any).message,
  //     code: (error as any).code,
  //     command: (error as any).command,
  //     response: (error as any).response
  //   });
  //   throw HTTPError(500, `Unable to send OTP email: ${(error as any).message}`);
  // }
};