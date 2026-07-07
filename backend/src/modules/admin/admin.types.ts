export interface AdminUserListItem {
  firstName: string;
  lastName: string;
  userId: string;
  isLocked: boolean;
  isVerified: boolean;
  email: string;
  updatedAt: string;
  KYCimg: string | null | undefined;
}

export interface AdminUserListResult {
  users: AdminUserListItem[];
  currentPage: number;
  totalUsers: number;
  totalPages: number;
}

/** Loose shape of the raw (non-lean) User doc returned by the `admin/users` list query. */
export interface AdminUserDocLike {
  firstName?: string | null;
  lastName?: string | null;
  _id: { toString(): string };
  isLocked: boolean;
  isVerified: boolean;
  email: string;
  updatedAt: Date;
  KYCimg?: string | null;
}

export interface AdminRequestListItem {
  itemid: string;
  name: string;
  transactionId: string;
  currency: string;
  amount: number;
  userId: string;
}

export interface AdminRequestListResult {
  requests: AdminRequestListItem[];
  currentPage: number;
  totalRequest: number;
  totalPages: number;
}

/** Loose shape of the raw (non-lean) TransactionItem doc returned by the withdraw-request query. */
export interface AdminRequestDocLike {
  _id: { toString(): string };
  name: string;
  transactionId: string;
  currency: string;
  amount: number;
  userId: { toString(): string };
}

/**
 * The live mongoose User document handed back by `findUserById`. The service
 * mutates `isVerified`/`isLocked` directly and calls `.save()` on it (matching
 * the legacy fire-and-forget `user.save()`), so it never needs to import the
 * User model itself.
 */
export interface AdminUserDoc {
  isVerified: boolean;
  isLocked: boolean;
  save(): unknown;
  [key: string]: unknown;
}

export interface CreateChallengeInput {
  category: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  exp: number;
  amountToGoal: number;
}

export interface CreateChallengeResult {
  success: true;
  newChallenge: unknown;
}

export interface CheckAllBalanceChallengesResult {
  success: true;
  totalUsers: number;
  results: unknown[];
}

export interface IAdminRepository {
  findUsersPage(skip: number, limit: number): Promise<AdminUserDocLike[]>;
  countUsers(): Promise<number>;
  findWithdrawRequestsPage(
    skip: number,
    limit: number
  ): Promise<AdminRequestDocLike[]>;
  findUserById(userId: string): Promise<AdminUserDoc | null>;
  createChallenge(input: CreateChallengeInput): Promise<unknown>;
  /** Ids of all `isActive: true` users, matching the legacy checkAll loop's `User.find({ isActive: true })`. */
  findActiveUserIds(): Promise<string[]>;
}

export interface AdminServiceDeps {
  repo: IAdminRepository;
  /** Cross-slice delegate, wired in the container (see `challenges/checkBalanceChallenges.ts`). */
  checkBalanceChallenges: (userId: string) => Promise<unknown>;
}
