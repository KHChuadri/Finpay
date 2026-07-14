import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  adminGetUserController,
  adminGetRequestController,
  adminVerifyController,
  adminBlockController,
  adminCreateChallengeController,
  adminCheckAllBalanceChallengesController,
} from "./admin.controller";

export const adminRouter = Router();

adminRouter.get("/admin/users", asyncHandler(adminGetUserController));
adminRouter.get("/admin/requests", asyncHandler(adminGetRequestController));
adminRouter.put("/admin/verify/:userId", asyncHandler(adminVerifyController));
adminRouter.put("/admin/block/:userId", asyncHandler(adminBlockController));
adminRouter.post(
  "/admin/createChallenge",
  asyncHandler(adminCreateChallengeController)
);
adminRouter.post(
  "/admin/checkAllBalanceChallenges",
  asyncHandler(adminCheckAllBalanceChallengesController)
);
