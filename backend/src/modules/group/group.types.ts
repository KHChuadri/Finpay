import type { ClientSession } from "mongoose";

export interface UserRecord {
  id: string;
  email: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface GroupRecord {
  id: string;
  groupName: string;
  walletBalance: number;
  walletCurrency: string;
  transactionHistoryIds: string[];
}

export interface RecordGroupTransactionInput {
  transactionType?: string;
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
  description: string;
}

/** Mirrors the fields the legacy `setDepositData` reads off the Zai webhook item. */
export interface DepositWebhookItem {
  id: string;
  name: string;
  description: string;
  state: string;
  amount: number;
  currency: string;
}

export interface DepositWebhookPayload {
  items: DepositWebhookItem;
}

export interface DepositResult {
  depositId: string;
}

export interface TopupInput {
  debtorWalletId: string;
  groupId: string;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
}

export interface WithdrawCreditorInfo {
  email: string;
  walletInfo: string[];
}

export interface WithdrawInput {
  creditorInfo: WithdrawCreditorInfo;
  groupId: string;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
}

export interface TopupResult {
  success: true;
  message: string;
  debtorWalletId: string;
  creditorWalletId: string;
  amountTransferred: string;
  newDebtorBalance: number;
  newCreditorBalance: number;
}

/** Preserves the legacy `newDeptorBalance` typo in the withdraw response shape. */
export interface WithdrawResult {
  success: true;
  message: string;
  creditorWalletId: string;
  debtorWalletId: string;
  amountTransferred: string;
  newCreditorBalance: number;
  newDeptorBalance: number;
}

export interface IGroupRepository {
  findUserById(id: string, session?: ClientSession): Promise<UserRecord | null>;
  findUserByEmail(
    email: string,
    session?: ClientSession
  ): Promise<UserRecord | null>;
  findUserByDepositId(
    depositId: string,
    session?: ClientSession
  ): Promise<UserRecord | null>;
  appendUserTransactionHistory(
    userId: string,
    transactionId: string,
    session?: ClientSession
  ): Promise<void>;

  findGroupById(
    id: string,
    session?: ClientSession
  ): Promise<GroupRecord | null>;
  adjustGroupBalance(
    groupId: string,
    delta: number,
    session?: ClientSession
  ): Promise<number>;
  appendGroupTransactionHistory(
    groupId: string,
    transactionId: string,
    session?: ClientSession
  ): Promise<void>;
  /** Raw (non-flattened) TransactionHistory docs — the frontend reads `_id` directly. */
  findTransactionHistoryByIds(
    ids: string[]
  ): Promise<Record<string, unknown>[]>;

  findWalletById(
    id: string,
    session?: ClientSession
  ): Promise<WalletRecord | null>;
  findWalletByUserAndCurrency(
    userId: string,
    currency: string,
    session?: ClientSession
  ): Promise<WalletRecord | null>;
  /** Any wallet among `ids` matching `currency` (matches legacy withdraw lookup). */
  findWalletByIdsAndCurrency(
    ids: string[],
    currency: string,
    session?: ClientSession
  ): Promise<WalletRecord | null>;
  createWallet(
    userId: string,
    currency: string,
    session?: ClientSession
  ): Promise<WalletRecord>;
  adjustWalletBalance(
    walletId: string,
    delta: number,
    session?: ClientSession
  ): Promise<number>;

  /** Returns whether a matching TransactionItem existed and was deleted. */
  deleteTransactionItemByTransactionId(
    transactionId: string,
    session?: ClientSession
  ): Promise<boolean>;
  recordTransaction(
    input: RecordGroupTransactionInput,
    session?: ClientSession
  ): Promise<string>;
}

export interface GroupServiceDeps {
  repo: IGroupRepository;
  exchangeRate: (src: string, dest: string) => Promise<{ rate: number }>;
  checkBalanceChallenges: (userId: string) => Promise<unknown>;
  trackChallengeProgress: (
    category: string,
    userId: string,
    amount: number
  ) => Promise<unknown>;
  /** Runs `fn` inside a single Mongoose transaction, committing on success and
   *  rolling back on throw. Keeps the service free of runtime Mongoose imports. */
  withTransaction: <T>(fn: (session: ClientSession) => Promise<T>) => Promise<T>;
}
