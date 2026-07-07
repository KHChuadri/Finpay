import { adminService } from "../modules/admin/admin.container";

/**
 * <Verify User by Admin>
 *
 * @param userId
 * @param verify
 * @returns User Object
 */
export const adminVerifyId = (userId: string, verify: boolean) =>
  adminService.verifyUser(userId, verify);
