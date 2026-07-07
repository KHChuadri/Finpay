// Composition root for the transaction slice: wires real dependencies once.
import mongoose from "mongoose";
import type { ClientSession } from "mongoose";
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeRate } from "../../exchangeRate";
import { checkBalanceChallenges } from "../../challenges/checkBalanceChallenges";
import { trackChallengeProgress } from "../../challenges/trackChallengeProgress";

// Runs `fn` inside a Mongoose transaction, committing on success and rolling
// back on throw. The only place the transaction slice touches Mongoose runtime.
const withTransaction = async <T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
};

export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate,
  checkBalanceChallenges,
  trackChallengeProgress,
  withTransaction,
});
