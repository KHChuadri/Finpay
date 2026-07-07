// Composition root for the admin slice: wires the real repository + the
// cross-slice checkBalanceChallenges delegate once.
import { createAdminService } from "./admin.service";
import { adminRepository } from "./admin.repository";
import { challengeService } from "../challenge/challenge.container";

export const adminService = createAdminService({
  repo: adminRepository,
  checkBalanceChallenges: challengeService.checkBalanceChallenges,
});
