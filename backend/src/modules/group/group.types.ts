import type { DbOrTx, Tx } from "../../../lib/db";

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

export interface UserNameRecord {
  id: string;
  firstName: string;
  lastName: string;
}

export interface UserDetailRecord {
  id: string;
  email: string;
  groups: string[];
  invitation: string[];
}

export interface GroupDetailRecord {
  id: string;
  groupName: string;
  description: string | null;
  admin: string;
  members: string[];
  pendingInvite: string[];
  walletBalance: number;
  walletCurrency: string;
  transactionHistoryIds: string[];
}

export interface CreateGroupInput {
  groupName: string;
  description: string;
  creatorId: string;
  currency: string;
}

export interface CreateGroupResult {
  groupId: string;
}

export interface CreateInvitationInput {
  groupName: string;
  groupId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
}

export interface CreateNotificationInput {
  type: string;
  senderId: string;
  receiverId: string;
  description: string;
}

export interface MemberRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IGroupRepository {
  findUserById(id: string, session?: DbOrTx): Promise<UserRecord | null>;
  findUserByEmail(
    email: string,
    session?: DbOrTx
  ): Promise<UserRecord | null>;
  findUserByDepositId(
    depositId: string,
    session?: DbOrTx
  ): Promise<UserRecord | null>;
  appendUserTransactionHistory(
    userId: string,
    transactionId: string,
    session?: DbOrTx
  ): Promise<void>;

  findGroupById(
    id: string,
    session?: DbOrTx
  ): Promise<GroupRecord | null>;
  adjustGroupBalance(
    groupId: string,
    delta: number,
    session?: DbOrTx
  ): Promise<number>;
  appendGroupTransactionHistory(
    groupId: string,
    transactionId: string,
    session?: DbOrTx
  ): Promise<void>;
  /** Raw (non-flattened) TransactionHistory docs — the frontend reads `_id` directly. */
  findTransactionHistoryByIds(
    ids: string[]
  ): Promise<Record<string, unknown>[]>;

  findWalletById(
    id: string,
    session?: DbOrTx
  ): Promise<WalletRecord | null>;
  findWalletByUserAndCurrency(
    userId: string,
    currency: string,
    session?: DbOrTx
  ): Promise<WalletRecord | null>;
  /** Any wallet among `ids` matching `currency` (matches legacy withdraw lookup). */
  findWalletByIdsAndCurrency(
    ids: string[],
    currency: string,
    session?: DbOrTx
  ): Promise<WalletRecord | null>;
  createWallet(
    userId: string,
    currency: string,
    session?: DbOrTx
  ): Promise<WalletRecord>;
  adjustWalletBalance(
    walletId: string,
    delta: number,
    session?: DbOrTx
  ): Promise<number>;

  /** Returns whether a matching TransactionItem existed and was deleted. */
  deleteTransactionItemByTransactionId(
    transactionId: string,
    session?: DbOrTx
  ): Promise<boolean>;
  recordTransaction(
    input: RecordGroupTransactionInput,
    session?: DbOrTx
  ): Promise<string>;

  // --- Group management / invitations ---

  findUserNameById(id: string): Promise<UserNameRecord | null>;
  /** `groups`/`invitation` are the user's referenced-id arrays as strings. */
  findUserDetailById(id: string): Promise<UserDetailRecord | null>;
  /** Raw (non-flattened) User doc — the frontend reads `_id` directly. */
  findUserRawById(id: string): Promise<Record<string, unknown> | null>;
  /** Raw (non-flattened) User docs — the frontend reads `_id` directly. */
  findUsersByIds(ids: string[]): Promise<Record<string, unknown>[]>;
  findMembersByIds(ids: string[]): Promise<MemberRecord[]>;
  appendUserGroup(userId: string, groupId: string): Promise<void>;
  removeUserGroup(userId: string, groupId: string): Promise<void>;
  addUserInvitation(userId: string, invitationId: string): Promise<void>;
  removeUserInvitation(userId: string, invitationId: string): Promise<void>;
  addUserNotification(userId: string, notificationId: string): Promise<void>;

  findGroupDetailById(id: string): Promise<GroupDetailRecord | null>;
  /** Raw (non-flattened) Group docs — the frontend reads `_id` directly. */
  findGroupsByIds(ids: string[]): Promise<Record<string, unknown>[]>;
  createGroup(input: CreateGroupInput): Promise<{ id: string }>;
  deleteGroupById(groupId: string): Promise<void>;
  /** Overwrites `members` (and `admin`, if provided) in one write. */
  setGroupMembersAndAdmin(
    groupId: string,
    members: string[],
    admin?: string
  ): Promise<void>;
  addGroupMember(groupId: string, userId: string): Promise<void>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  addGroupPendingInvite(groupId: string, invitationId: string): Promise<void>;
  removeGroupPendingInvite(
    groupId: string,
    invitationId: string
  ): Promise<void>;

  findInvitationById(
    id: string
  ): Promise<{ id: string; groupId: string; receiver: string } | null>;
  /** Raw (non-flattened) Invitation docs — the frontend reads `_id` directly. */
  findInvitationsByIds(ids: string[]): Promise<Record<string, unknown>[]>;
  createInvitation(input: CreateInvitationInput): Promise<{ id: string }>;
  createNotification(input: CreateNotificationInput): Promise<{ id: string }>;
  deleteInvitationById(invitationId: string): Promise<void>;
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
  withTransaction: <T>(fn: (session: Tx) => Promise<T>) => Promise<T>;
}
