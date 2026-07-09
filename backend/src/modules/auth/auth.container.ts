// Composition root for the auth slice: wires the real repository once.
import { createAuthService } from "./auth.service";
import { authRepository } from "./auth.repository";

export const authService = createAuthService({
  repo: authRepository,
});
