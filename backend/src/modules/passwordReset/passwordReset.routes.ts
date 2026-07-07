import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  resetPasswordController,
  resetPasswordTokenController,
  sendPasswordResetEmailController,
} from "./passwordReset.controller";

export const passwordResetRouter = Router();

passwordResetRouter.get(
  "/send-password-reset-email",
  asyncHandler(sendPasswordResetEmailController)
);
passwordResetRouter.get(
  "/reset-password-token/:token",
  asyncHandler(resetPasswordTokenController)
);
passwordResetRouter.put("/reset-password", asyncHandler(resetPasswordController));
