import { Request, Response } from "express";
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeRate } from "../../exchangeRate";
import { checkBalanceChallenges } from "../../challenges/checkBalanceChallenges";
import { trackChallengeProgress } from "../../challenges/trackChallengeProgress";

// Composition root for the transaction slice: wires real dependencies once.
export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate,
  checkBalanceChallenges,
  trackChallengeProgress,
});

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
