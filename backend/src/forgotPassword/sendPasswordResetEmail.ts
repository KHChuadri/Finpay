import User from "../../model/User";
import HTTPError from "http-errors";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

/**
 * <Sends Forgot Password Email To User>
 * 
 * @param {string} email 
 * @returns { success: boolean, message: string } object containing process status, and message of completion
 */
export const sendPasswordResetEmail = async (email: string) => {
  dotenv.config();

  const correspondingUser = await User.findOne({ email });
  const logoPath = path.join(__dirname, "./finpay_icon.png");

  if (!correspondingUser) {
    throw HTTPError(404, "User with this email not found");
  }

  const token = uuidv4();
  correspondingUser.resetPasswordToken = token;
  correspondingUser.resetPasswordTokenExpiryDate = Date.now() + 3600000; // 1 hour

  await correspondingUser.save();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "finpay.comp3900@gmail.com",
      pass: process.env.APP_PASSWORD!,
    },
  });

  const resetLink = `http://localhost:5173/reset-password/${token}`;
  await transporter.sendMail({
    to: correspondingUser.email,
    subject: "Password Reset",
    html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>Password Reset</title>
            </head>
            <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                    <table width="600" align="center" bgcolor="#ffffff" cellpadding="20" cellspacing="0" style="margin: 40px auto; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <tr>
                        <td style="text-align: center;">
                            <img src="cid:finpaylogo" alt="Reset Password" width="100" style="margin-bottom: 20px;" />
                            <h2 style="color: #333;">Reset Your Password</h2>
                            <p style="font-size: 16px; color: #555;">
                            We received a request to reset your password. Click the button below to proceed.
                            </p>
                            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #C6412A; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; margin-top: 20px;">
                            Reset Password
                            </a>
                            <p style="font-size: 14px; color: #999; margin-top: 30px;">
                            If you did not request a password reset, please ignore this email.
                            </p>
                        </td>
                        </tr>
                    </table>
                    <p style="text-align: center; color: #aaa; font-size: 12px;">
                        © 2025 FinPay. All rights reserved.
                    </p>
                    </td>
                </tr>
                </table>
            </body>
            </html>
        `,
    attachments: [
      {
        filename: "finpay_icon.png",
        path: logoPath,
        cid: "finpaylogo",
      },
    ],
  });

  return { success: true, message: "Reset password email has been sent." };
};
