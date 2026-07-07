import { challengeService } from "../modules/challenge/challenge.container";

/**
 * <Track User Challenge Progress>
 *
 * @param {string} category
 * @param {string} userId
 * @param {number} amount
 * @returns {success: boolean, updated: number,
 * completedChallenges: [String]} Object containing newly updated user challenge progress
 */
export const trackChallengeProgress = (
  category: string,
  userId: string,
  amount: number
) => challengeService.trackChallengeProgress(category, userId, amount);
