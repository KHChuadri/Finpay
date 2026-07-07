// Composition root for the group slice: wires real dependencies once.
import mongoose from "mongoose";
import type { ClientSession } from "mongoose";
import { createGroupService } from "./group.service";
import { groupRepository } from "./group.repository";
import { exchangeRate } from "../../exchangeRate";
import { checkBalanceChallenges } from "../../challenges/checkBalanceChallenges";
import { trackChallengeProgress } from "../../challenges/trackChallengeProgress";

// Runs `fn` inside a Mongoose transaction, committing on success and rolling
// back on throw. The only place the group slice touches Mongoose runtime
// outside of the repository.
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

export const groupService = createGroupService({
  repo: groupRepository,
  exchangeRate,
  checkBalanceChallenges,
  trackChallengeProgress,
  withTransaction,
});
