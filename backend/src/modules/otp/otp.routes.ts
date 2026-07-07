import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { createOtpController, verifyOtpController } from "./otp.controller";

export const otpRouter = Router();

otpRouter.post("/authentication/create/otp", asyncHandler(createOtpController));
otpRouter.post("/authentication/verify/otp", asyncHandler(verifyOtpController));
