import { Request, Response } from "express";
import { transactionService } from "./transaction.container";

export const p2pTransferController = async (req: Request, res: Response) => {
  const {
    debtorUserId,
    creditor,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const result = await transactionService.transfer({
    debtorUserId,
    creditorEmail: creditor,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(result);
};
