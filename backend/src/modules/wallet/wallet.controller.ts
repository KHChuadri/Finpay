import { Request, Response } from "express";
import { walletService } from "./wallet.container";

export const getWalletController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currency = req.query.currency as string;

  const response = currency
    ? await walletService.getWalletInfoByCurrency(userId, currency)
    : await walletService.getAllWallets(userId);

  res.json(response);
};

export const createWalletController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { walletCurrency } = req.body;

  const response = await walletService.createCurrencyWallet(
    userId,
    walletCurrency
  );
  res.json(response);
};

export const getCurrentWalletController = async (
  req: Request,
  res: Response
) => {
  const { currency, userId } = req.params;

  const response = await walletService.getCurrentWallet(userId, currency);
  res.json(response);
};

export const deleteWalletController = async (req: Request, res: Response) => {
  const { currency, userId } = req.params;

  const response = await walletService.deleteWallet(userId, currency);
  res.json(response);
};
