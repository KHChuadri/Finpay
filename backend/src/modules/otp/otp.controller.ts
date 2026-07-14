import { Request, Response } from "express";
import { otpService } from "./otp.container";

export const createOtpController = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const response = await otpService.sendOtpEmail(userId);
  res.json(response);
};

export const verifyOtpController = async (req: Request, res: Response) => {
  const { otpId, otp, userId, email } = req.body;
  const response = await otpService.verifyOtp(otpId, otp, userId, email);
  res.json(response);
};
