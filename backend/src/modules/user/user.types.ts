import type { TransactionHistoryType } from "../../../model/TransactionHistory";

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
  /** Returns raw transaction history docs (incl. `_id`, timestamps, `__v`) — matches legacy serialization. */
  findTransactionHistoryByIds(
    ids: string[]
  ): Promise<TransactionHistoryType[]>;
}

export interface UserServiceDeps {
  repo: IUserRepository;
}
