// Legacy entry point retained during the strangler migration.
// Delegates to the layered wallet service so existing callers/tests are unaffected.
import { walletService } from "../modules/wallet/wallet.container";

export const getUserWalletInfo = async (userId: string, currency: string) =>
  walletService.getWalletInfoByCurrency(userId, currency);
