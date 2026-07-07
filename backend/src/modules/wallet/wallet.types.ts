import type { WalletInfoType } from "../../../model/WalletInfo";

export interface WalletRecord {
  id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string;
}

export interface UserWithWallets {
  id: string;
  /** Raw wallet docs (incl. `_id`, timestamps, `__v`) — matches legacy serialization. */
  wallets: WalletInfoType[];
}

export interface IWalletRepository {
  findUserById(userId: string): Promise<{ id: string } | null>;
  /** Populates the user's `walletInfo` refs and returns the raw wallet docs. */
  findUserWithWallets(userId: string): Promise<UserWithWallets | null>;
  /** Returns raw wallet docs (incl. `_id`, timestamps, `__v`) — matches legacy serialization. */
  findWalletsByUserId(userId: string): Promise<WalletInfoType[]>;
  findWallet(userId: string, currency: string): Promise<WalletRecord | null>;
  /** Creates the wallet and appends its id to the user's `walletInfo` array. */
  createWallet(userId: string, currency: string): Promise<WalletRecord>;
  deleteWalletById(walletId: string): Promise<boolean>;
}

export interface WalletServiceDeps {
  repo: IWalletRepository;
}
