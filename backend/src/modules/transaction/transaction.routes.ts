import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { p2pTransferController } from "./transaction.controller";

export const transactionRouter = Router();

transactionRouter.post("/p2ptransfer", asyncHandler(p2pTransferController));
