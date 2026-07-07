import { challengeService } from "../modules/challenge/challenge.container";

/**
 * <Check User's progress on balance challenges update if there are any progress>
 *
 * @param {string} userId
 * @returns {success: boolean, updated: number,
 * completedChallenges: [String]} Object containing newly updated user challenge progress
 */
export const checkBalanceChallenges = (userId: string) =>
  challengeService.checkBalanceChallenges(userId);
