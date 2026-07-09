import { Request, Response } from "express";
import { bankService } from "./bank.container";

export const withdrawController = async (req: Request, res: Response) => {
  const { amount, userId } = req.query;
  const response = await bankService.withdrawRequest(
    userId as string,
    Number(amount)
  );
  res.json(response);
};

export const depositController = async (req: Request, res: Response) => {
  const { amount, userId } = req.query;
  const response = await bankService.depositRequest(
    userId as string,
    Number(amount)
  );
  res.json(response);
};

export const processWithdrawalController = async (
  req: Request,
  res: Response
) => {
  const { transactionId } = req.params;
  const response = await bankService.processWithdrawalRequest(transactionId);
  res.json(response);
};
