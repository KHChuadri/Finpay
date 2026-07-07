import { adminService } from "../modules/admin/admin.container";

/**
 * <Find active withdraw request>
 *
 * @param {number} page
 * @param {number} limit
 * @returns {requests: List of TransactionItem object, currentPage: number, totalRequest: number,
 *  totalPages: number} Object containing transaction request that will fit in a certain page
 */
export const adminGetRequest = (page: number, limit: number) =>
  adminService.getRequests(page, limit);
