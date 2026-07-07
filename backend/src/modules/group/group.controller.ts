import { Request, Response } from "express";
import { groupService } from "./group.container";

export const webhookController = async (req: Request, res: Response) => {
  const depositData = req.body;
  const response = await groupService.setDepositData(depositData);
  res.status(201).json(response);
};

export const topupController = async (req: Request, res: Response) => {
  const {
    debtorAccountWallet,
    groupId,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const response = await groupService.topup({
    debtorWalletId: debtorAccountWallet,
    groupId,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(response);
};

export const withdrawController = async (req: Request, res: Response) => {
  const {
    creditorInfo,
    groupId,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const response = await groupService.withdraw({
    creditorInfo,
    groupId,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(response);
};

export const getGroupTransactionHistoryController = async (
  req: Request,
  res: Response
) => {
  const groupId = req.query.groupId as string;
  const response = await groupService.getGroupTransactionHistory(groupId);
  res.json(response);
};
