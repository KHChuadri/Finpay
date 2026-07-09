/** Serialized transaction matching the legacy `.lean()` doc the frontend keys by `_id`. */
export interface LeanTransaction {
  _id: string;
  transactionType: string | null;
  amountSrc: number;
  currencySource: string;
  amountDest: number;
  currencyDest: string;
  fromAccount: string;
  toAccount: string;
  fromAccountEmail: string;
  toAccountEmail: string;
  fromAccountId: string;
  toAccountId: string;
  transactionDate: Date | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRankRecord {
  id: string;
  rank: string;
}

export interface UserAdminRecord {
  id: string;
  isAdmin: boolean;
}

export interface UserWithTransactionHistory {
  id: string;
  transactionHistory: string[];
}

export interface IUserRepository {
  findUserRankById(userId: string): Promise<UserRankRecord | null>;
  findUserAdminById(userId: string): Promise<UserAdminRecord | null>;
  findUserWithTransactionHistory(
    userId: string
  ): Promise<UserWithTransactionHistory | null>;
  /** Returns transaction docs as lean objects keyed by `_id`. */
  findTransactionHistoryByIds(
    ids: string[]
  ): Promise<LeanTransaction[]>;
}

export interface UserServiceDeps {
  repo: IUserRepository;
}
