import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  adminLoginController,
  loginController,
  logoutController,
  registerController,
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(registerController));
authRouter.post("/login", asyncHandler(loginController));
authRouter.post("/admin/login", asyncHandler(adminLoginController));
authRouter.post("/logout", asyncHandler(logoutController));
