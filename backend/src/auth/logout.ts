// Legacy entry point retained during the strangler migration.
// Delegates to the layered auth service so existing callers/tests are unaffected.
import { authService } from "../modules/auth/auth.container";

export const logout = async (token: string, userId: string) =>
  authService.logout(token, userId);
