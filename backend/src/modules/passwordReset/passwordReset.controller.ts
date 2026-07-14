import { Request, Response } from "express";
import { passwordResetService } from "./passwordReset.container";

export const sendPasswordResetEmailController = async (
  req: Request,
  res: Response
) => {
  const email = req.query.email as string;
  const response = await passwordResetService.sendPasswordResetEmail(email);
  res.json(response);
};

export const resetPasswordTokenController = async (
  req: Request,
  res: Response
) => {
  const { token } = req.params;
  const response = await passwordResetService.resetPasswordToken(token);
  res.status(200).json(response);
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const response = await passwordResetService.resetPassword(token, password);
  res.json(response);
};
