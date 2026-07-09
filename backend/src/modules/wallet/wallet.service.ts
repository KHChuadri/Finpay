import HTTPError from "http-errors";
import type { WalletServiceDeps } from "./wallet.types";

export const createWalletService = (deps: WalletServiceDeps) => {
  const { repo } = deps;

  /** Mirrors legacy getUserWallet: all of a user's wallets. */
  const getAllWallets = async (userId: string) => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "getUserWallet: user not found");
    }

    const wallets = await repo.findWalletsByUserId(userId);
    return { wallets };
  };

  /** Mirrors legacy getUserWalletInfo: a single wallet by currency. */
  const getWalletInfoByCurrency = async (userId: string, currency: string) => {
    if (!userId && !currency) {
      throw HTTPError(
        400,
        "getUserWalletInfo: Missing required fields: userId and currency"
      );
    }
    if (!userId) {
      throw HTTPError(
        400,
        "getUserWalletInfo: Missing required field: userId"
      );
    }
    if (!currency) {
      throw HTTPError(
        400,
        "getUserWalletInfo: Missing required field: currency"
      );
    }

    const user = await repo.findUserWithWallets(userId);
    if (!user) {
      throw HTTPError(404, "getUserWalletInfo: No user found");
    }

    const correspondingWallet = user.wallets.find(
      (w) => w.walletCurrency === currency
    );
    if (!correspondingWallet) {
      throw HTTPError(
        404,
        "getUserWalletInfo: User has no wallet with corresponding currency."
      );
    }

    return { correspondingWallet };
  };

  /** Mirrors legacy storeMultiWallet: create a new currency wallet. */
  const createCurrencyWallet = async (
    userId: string,
    walletCurrency: string
  ) => {
    const findUser = await repo.findUserById(userId);
    const findWallet = await repo.findWallet(userId, walletCurrency);

    if (!findUser) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (findWallet) {
      throw HTTPError(
        400,
        "This currency has already been added to your wallet"
      );
    }

    await repo.createWallet(userId, walletCurrency);
    return { message: "Store multi wallet successful" };
  };

  /** Mirrors legacy getCurrentWallet: flat wallet id/balance/currency. */
  const getCurrentWallet = async (userId: string, currency: string) => {
    const wallet = await repo.findWallet(userId, currency);
    if (!wallet) {
      throw HTTPError(404, "wallet not found");
    }

    return {
      walletId: wallet.id,
      walletBalance: wallet.walletBalance,
      walletCurrency: wallet.walletCurrency,
    };
  };

  /** Mirrors legacy deleteWallet. */
  const deleteWallet = async (userId: string, currency: string) => {
    const wallet = await repo.findWallet(userId, currency);
    if (!wallet) {
      throw HTTPError(404, "wallet not found");
    }

    const deleted = await repo.deleteWalletById(wallet.id);
    if (!deleted) {
      throw HTTPError(500, "Wallet deletion failed");
    }

    return { message: "Wallet deleted successfully" };
  };

  return {
    getAllWallets,
    getWalletInfoByCurrency,
    createCurrencyWallet,
    getCurrentWallet,
    deleteWallet,
  };
};
