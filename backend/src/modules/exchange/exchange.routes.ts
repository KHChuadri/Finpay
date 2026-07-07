import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { getExchangeRateController } from "./exchange.controller";

export const exchangeRouter = Router();

exchangeRouter.get(
  "/exchangerate/:currencySource/:currencyDest",
  asyncHandler(getExchangeRateController)
);
