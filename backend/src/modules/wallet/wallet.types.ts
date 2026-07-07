export interface WalletRecord {
  id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string;
}

export interface UserWithWallets {
  id: string;
  wallets: WalletRecord[];
}

export interface IWalletRepository {
  findUserById(userId: string): Promise<{ id: string } | null>;
  /** Populates the user's `walletInfo` refs and maps each to a flat WalletRecord. */
  findUserWithWallets(userId: string): Promise<UserWithWallets | null>;
  findWalletsByUserId(userId: string): Promise<WalletRecord[]>;
  findWallet(userId: string, currency: string): Promise<WalletRecord | null>;
  /** Creates the wallet and appends its id to the user's `walletInfo` array. */
  createWallet(userId: string, currency: string): Promise<WalletRecord>;
  deleteWalletById(walletId: string): Promise<boolean>;
}

export interface WalletServiceDeps {
  repo: IWalletRepository;
}
