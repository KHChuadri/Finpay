import { adminService } from "../modules/admin/admin.container";

/**
 * <creating new user challenges by admin>
 *
 * @param {string} category
 * @param {string} title
 * @param {string} description
 * @param {string} startDate
 * @param {string} endDate
 * @param {number} exp
 * @param {number} amountToGoal
 * @returns {success: boolean, newChallenge : Challenge Object} object status and the challenge object
 */
export const adminCreateChallenge = (
  category: string,
  title: string,
  description: string,
  startDate: string,
  endDate: string,
  exp: number,
  amountToGoal: number
) =>
  adminService.createChallenge({
    category,
    title,
    description,
    startDate,
    endDate,
    exp,
    amountToGoal,
  });
