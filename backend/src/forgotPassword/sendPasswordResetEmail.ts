// Legacy entry point retained during the strangler migration.
// Delegates to the layered password-reset service so existing callers/tests are unaffected.
import { passwordResetService } from "../modules/passwordReset/passwordReset.container";

export const sendPasswordResetEmail = async (email: string) =>
  passwordResetService.sendPasswordResetEmail(email);
