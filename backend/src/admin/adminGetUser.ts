import { adminService } from "../modules/admin/admin.container";

/**
 * <Gets a list of users depending on page and limit per page>
 *
 * @param {number} page
 * @param {number} limit
 * @returns {users: List of User Object, currentPage: number, totalRequest: number,
 *  totalPages: number} Object containing list of user that will fit in a certain page
 */
export const adminGetUser = (page: number, limit: number) =>
  adminService.getUsers(page, limit);
