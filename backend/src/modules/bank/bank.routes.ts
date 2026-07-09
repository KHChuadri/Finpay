import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  depositController,
  processWithdrawalController,
  withdrawController,
} from "./bank.controller";

export const bankRouter = Router();

bankRouter.get("/bankintegration/withdraw", asyncHandler(withdrawController));
bankRouter.get("/bankintegration/deposit", asyncHandler(depositController));
bankRouter.get(
  "/bankintegration/doTransaction/:transactionId",
  asyncHandler(processWithdrawalController)
);
