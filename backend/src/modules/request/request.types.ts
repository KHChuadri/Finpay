export interface UserBasic {
  id: string;
  email: string;
}

export interface RequestRecord {
  id: string;
  userId: string;
  senderEmail: string;
  currency: string;
  amount: number;
  notes: string;
  date: Date;
}

export interface RequestListItem {
  requestId: string;
  senderEmail: string;
  requestDate: Date;
  amount: number;
  currency: string;
  notes: string;
}

export interface SavedRecipient {
  email: string;
  firstName: string;
  lastName: string;
}

export interface RecipientInfo {
  email: string;
  walletInfo: string[];
}

export interface CreateRequestInput {
  recipientUserId: string;
  recipientEmail: string;
  senderEmail: string;
  amount: number;
  currency: string;
  notes: string;
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

export interface IRequestRepository {
  findUserById(id: string): Promise<UserBasic | null>;
  findUserByEmail(email: string): Promise<UserBasic | null>;
  /** Creates the Request doc and appends its id to the recipient's `request` array. */
  createRequestForRecipient(input: CreateRequestInput): Promise<string>;
  findUserWithRequestIds(
    userId: string
  ): Promise<{ id: string; requestIds: string[] } | null>;
  findRequestsByIds(ids: string[]): Promise<RequestListItem[]>;
  findRequestById(requestId: string): Promise<RequestRecord | null>;
  /** Any wallet belonging to the user, regardless of currency (matches legacy). */
  findWalletByUserId(userId: string): Promise<{ id: string } | null>;
  findWalletsByUserAndCurrency(
    userId: string,
    currency: string
  ): Promise<{ id: string }[]>;
  /** Deletes the request doc and pulls its id from the user's `request` array. */
  deleteRequestAndUnlink(requestId: string, userId: string): Promise<void>;
  findSavedRecipients(userId: string): Promise<SavedRecipient[]>;
  findRecipientInfo(email: string, userId: string): Promise<RecipientInfo | null>;
}

export interface RequestServiceDeps {
  repo: IRequestRepository;
  /** Injected transfer delegate (wired from the transaction slice's service). */
  transfer: (input: TransferInput) => Promise<TransferResult>;
}
