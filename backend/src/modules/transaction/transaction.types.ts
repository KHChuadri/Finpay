import type { DbOrTx, Tx } from "../../../lib/db";

export interface UserRecord {
  id: string;
  email: string;
  rank: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface TransferInput {
  debtorUserId: string;
  creditorEmail: string;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
}

export interface TransferResult {
  success: true;
  message: string;
  debtorWalletId: string;
  creditorWalletId: string;
  amountTransferred: string;
  newDebtorBalance: number;
  newCreditorBalance: number;
}

export interface RecordTransactionInput {
  fromUser: UserRecord;
  toUser: UserRecord;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
  description: string;
}

export interface ITransactionRepository {
  findUserById(id: string, session?: DbOrTx): Promise<UserRecord | null>;
  findUserByEmail(
    email: string,
    session?: DbOrTx
  ): Promise<UserRecord | null>;
  findWallet(
    userId: string,
    currency: string,
    session?: DbOrTx
  ): Promise<WalletRecord | null>;
  createWallet(
    userId: string,
    currency: string,
    session?: DbOrTx
  ): Promise<WalletRecord>;
  /** Applies delta to the wallet balance, persists, returns the new balance. */
  adjustWalletBalance(
    walletId: string,
    delta: number,
    session?: DbOrTx
  ): Promise<number>;
  /** Creates a TransactionHistory doc and appends its id to both users' history
   *  (once only when fromUser.id === toUser.id). Returns the new transaction id. */
  recordTransaction(
    input: RecordTransactionInput,
    session?: DbOrTx
  ): Promise<string>;
}

export interface TransactionServiceDeps {
  repo: ITransactionRepository;
  exchangeRate: (src: string, dest: string) => Promise<{ rate: number }>;
  checkBalanceChallenges: (userId: string) => Promise<unknown>;
  trackChallengeProgress: (
    category: string,
    userId: string,
    amount: number
  ) => Promise<unknown>;
  /** Runs `fn` inside a single Mongoose transaction, committing on success and
   *  rolling back on throw. Keeps the service free of runtime Mongoose imports. */
  withTransaction: <T>(fn: (session: Tx) => Promise<T>) => Promise<T>;
}
