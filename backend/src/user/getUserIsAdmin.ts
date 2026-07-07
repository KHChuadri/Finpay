// Legacy entry point retained during the strangler migration.
// Delegates to the layered user service so existing callers/tests are unaffected.
import { userService } from "../modules/user/user.container";

export const getUserIsAdmin = async (userId: string) =>
  userService.getUserIsAdmin(userId);
