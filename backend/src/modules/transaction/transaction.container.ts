// Composition root for the transaction slice: wires real dependencies once.
import { getDb, type Tx } from "../../../lib/db";
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeService } from "../exchange/exchange.container";
import { challengeService } from "../challenge/challenge.container";

// Runs `fn` inside a Postgres transaction, committing on success and rolling
// back on throw. The only place the transaction slice touches the DB runtime.
export const transactionContainerWithTransaction = async <T>(
  fn: (tx: Tx) => Promise<T>
): Promise<T> => {
  return getDb().transaction(async (tx) => fn(tx));
};

export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate: exchangeService.getRate,
  checkBalanceChallenges: challengeService.checkBalanceChallenges,
  trackChallengeProgress: challengeService.trackChallengeProgress,
  withTransaction: transactionContainerWithTransaction,
});
