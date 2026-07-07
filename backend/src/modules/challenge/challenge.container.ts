// Composition root for the challenge slice: wires real dependencies once.
import { createChallengeService } from "./challenge.service";
import { challengeRepository } from "./challenge.repository";
import { exchangeService } from "../exchange/exchange.container";
import { updateUserRank } from "../../user/updateUserRank";

export const challengeService = createChallengeService({
  repo: challengeRepository,
  exchangeRate: exchangeService.getRate,
  updateUserRank,
});
