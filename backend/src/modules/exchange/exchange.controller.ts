import { Request, Response } from "express";
import { exchangeService } from "./exchange.container";

export const getExchangeRateController = async (
  req: Request,
  res: Response
) => {
  const { currencySource, currencyDest } = req.params;

  const result = await exchangeService.getRate(currencySource, currencyDest);
  res.json(result);
};
