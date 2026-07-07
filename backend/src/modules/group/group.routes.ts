import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  webhookController,
  topupController,
  withdrawController,
  getGroupTransactionHistoryController,
} from "./group.controller";

// A single router for the group module — the follow-up task that adds group
// management/CRUD endpoints (create/leave/invite/member/etc.) extends this
// same router.
export const groupRouter = Router();

groupRouter.post("/webhook", asyncHandler(webhookController));
groupRouter.post("/topup", asyncHandler(topupController));
groupRouter.post("/withdraw", asyncHandler(withdrawController));
groupRouter.get(
  "/group/transaction/history",
  asyncHandler(getGroupTransactionHistoryController)
);
