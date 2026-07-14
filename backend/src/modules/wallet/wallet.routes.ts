import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  createWalletController,
  deleteWalletController,
  getCurrentWalletController,
  getWalletController,
} from "./wallet.controller";

export const walletRouter = Router();

walletRouter.get("/wallet/:userId", asyncHandler(getWalletController));
walletRouter.put("/wallet/:userId", asyncHandler(createWalletController));
walletRouter.get(
  "/currencywallet/:currency/:userId",
  asyncHandler(getCurrentWalletController)
);
walletRouter.delete(
  "/currencywallet/:currency/:userId",
  asyncHandler(deleteWalletController)
);
