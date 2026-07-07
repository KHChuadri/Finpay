// Legacy entry point retained during the strangler migration.
// Delegates to the layered wallet service so existing callers/tests are unaffected.
import { walletService } from "./modules/wallet/wallet.container";

export const deleteWallet = async (currency: string, userId: string) =>
  walletService.deleteWallet(userId, currency);
