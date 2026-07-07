// Legacy entry point retained during the strangler migration.
// Delegates to the layered auth service so existing callers/tests are unaffected.
import { authService } from "../modules/auth/auth.container";

export const adminLogin = async (email: string, password: string) =>
  authService.adminLogin(email, password);
