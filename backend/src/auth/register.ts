// Legacy entry point retained during the strangler migration.
// Delegates to the layered auth service so existing callers/tests are unaffected.
import { authService } from "../modules/auth/auth.container";

export const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => authService.register(firstName, lastName, email, password);
