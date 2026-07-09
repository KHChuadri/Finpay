import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  getUserIsAdminController,
  getUserRankController,
  getUserTransactionHistoryController,
} from "./user.controller";

export const userRouter = Router();

userRouter.get(
  "/user/transaction/history",
  asyncHandler(getUserTransactionHistoryController)
);
userRouter.get("/isAdmin/:userId", asyncHandler(getUserIsAdminController));
// Greedy route — matches any `/:userId/rank` path. Must stay mounted where the
// legacy inline route resolved (after the other slice routers, before the
// remaining un-migrated inline routes) so it doesn't shadow other endpoints.
userRouter.get("/:userId/rank", asyncHandler(getUserRankController));
