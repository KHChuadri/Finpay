// Composition root for the password-reset slice: wires the real repository once.
import { createPasswordResetService } from "./passwordReset.service";
import { passwordResetRepository } from "./passwordReset.repository";

export const passwordResetService = createPasswordResetService({
  repo: passwordResetRepository,
});
