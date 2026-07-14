export interface WalletRecord {
  id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string;
}

/** Serialized wallet matching the legacy `.lean()` doc the frontend keys by `_id`. */
export interface LeanWallet {
  _id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithWallets {
  id: string;
  wallets: LeanWallet[];
}

export interface IWalletRepository {
  findUserById(userId: string): Promise<{ id: string } | null>;
  /** Returns the user's wallets as lean docs (keyed by `_id`). */
  findUserWithWallets(userId: string): Promise<UserWithWallets | null>;
  /** Returns the user's wallets as lean docs (keyed by `_id`). */
  findWalletsByUserId(userId: string): Promise<LeanWallet[]>;
  findWallet(userId: string, currency: string): Promise<WalletRecord | null>;
  /** Creates the wallet for the user (linked by FK). */
  createWallet(userId: string, currency: string): Promise<WalletRecord>;
  deleteWalletById(walletId: string): Promise<boolean>;
}

export interface WalletServiceDeps {
  repo: IWalletRepository;
}
