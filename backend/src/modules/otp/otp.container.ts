// Composition root for the otp slice: wires the real repository once.
import { createOtpService } from "./otp.service";
import { otpRepository } from "./otp.repository";

export const otpService = createOtpService({
  repo: otpRepository,
});
