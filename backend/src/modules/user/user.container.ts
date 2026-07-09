// Composition root for the user slice: wires the real repository once.
import { createUserService } from "./user.service";
import { userRepository } from "./user.repository";

export const userService = createUserService({
  repo: userRepository,
});
