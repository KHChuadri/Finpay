// Composition root for the wallet slice: wires the real repository once.
import { createWalletService } from "./wallet.service";
import { walletRepository } from "./wallet.repository";

export const walletService = createWalletService({
  repo: walletRepository,
});
