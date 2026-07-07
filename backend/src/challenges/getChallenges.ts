import { challengeService } from "../modules/challenge/challenge.container";

/**
 * <Get User's Challenge List>
 *
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 * @returns {success: boolean,
 *   challenge: Array of Challenge Object,
 *   currentPage: number,
 *   totalPayments: number,
 *   totalPages: number,
 * } object with challenge information, list of challenges, and status of process
 */
export const getChallenges = (userId: string, page: number, limit: number) =>
  challengeService.getChallenges(userId, page, limit);
