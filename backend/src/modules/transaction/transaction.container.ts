// Composition root for the transaction slice: wires real dependencies once.
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeRate } from "../../exchangeRate";
import { checkBalanceChallenges } from "../../challenges/checkBalanceChallenges";
import { trackChallengeProgress } from "../../challenges/trackChallengeProgress";

export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate,
  checkBalanceChallenges,
  trackChallengeProgress,
});
