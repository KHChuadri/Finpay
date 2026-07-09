// Composition root for the group slice: wires real dependencies once.
import { getDb, type Tx } from "../../../lib/db";
import { createGroupService } from "./group.service";
import { groupRepository } from "./group.repository";
import { exchangeService } from "../exchange/exchange.container";
import { challengeService } from "../challenge/challenge.container";

// Runs `fn` inside a Postgres transaction, committing on success and rolling
// back on throw. The only place the group slice touches the DB runtime outside
// of the repository.
const withTransaction = async <T>(fn: (tx: Tx) => Promise<T>): Promise<T> => {
  return getDb().transaction(async (tx) => fn(tx));
};

export const groupService = createGroupService({
  repo: groupRepository,
  exchangeRate: exchangeService.getRate,
  checkBalanceChallenges: challengeService.checkBalanceChallenges,
  trackChallengeProgress: challengeService.trackChallengeProgress,
  withTransaction,
});
