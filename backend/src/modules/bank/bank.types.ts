export interface BankUserRecord {
  id: string;
  firstName: string;
  lastName: string;
  depositId: string;
}

export interface BankMainWalletRecord {
  id: string;
  walletBalance: number;
}

export interface CreateTransactionItemInput {
  transactionType: "Withdraw" | "Deposit";
  userId: string;
  transactionId: string;
  amount: number;
  depositId: string;
  name: string;
}

export interface IBankRepository {
  findUserById(userId: string): Promise<BankUserRecord | null>;
  /** The user's AUD wallet (the only currency bank integration operates on). */
  findMainWallet(userId: string): Promise<BankMainWalletRecord | null>;
  /** Generates a transaction id guaranteed not to collide with an existing item. */
  generateUniqueTransactionId(): Promise<string>;
  createTransactionItem(input: CreateTransactionItemInput): Promise<void>;
  /** Decrements the user's main wallet balance and persists it. */
  debitMainWallet(userId: string, amount: number): Promise<void>;
  /**
   * Mirrors a legacy bug in `doWithdraw`: the delete query's result is never
   * awaited/executed, so it is always a truthy Query object (the "not found"
   * branch built around it is unreachable) and the underlying TransactionItem
   * is never actually removed. Preserved intentionally for exact behavioral
   * parity with the code being migrated.
   */
  deleteTransactionItemByTransactionId(transactionId: string): unknown;
}

export interface CreateItemPayload {
  id: string;
  name: string;
  amount: number;
  payment_type: string;
  buyer_id: string;
  seller_id: string;
  description: string;
}

export interface BankServiceDeps {
  repo: IBankRepository;
  fetchTransactionToken: () => Promise<string>;
  fetchCreateItem: (
    payload: CreateItemPayload,
    transactionToken: string
  ) => Promise<unknown>;
  fetchDoWithdraw: (
    transactionToken: string,
    transactionId: string
  ) => Promise<unknown>;
}
