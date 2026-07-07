import { adminService } from "../modules/admin/admin.container";

/**
 * <Blocks the user by admin>
 *
 * @param {string} userId
 * @param {boolean} block
 * @returns User Object
 */
export const adminBlockId = (userId: string, block: boolean) =>
  adminService.blockUser(userId, block);
