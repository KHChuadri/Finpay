export interface ChallengeRecord {
  _id: string;
  title: string;
  description: string;
  exp: number;
  startDate: Date;
  endDate: Date;
  category: string;
  amountToGoal: number;
}

export interface UserChallengeProgressRecord {
  _id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  lastCheckedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChallengeWalletRecord {
  currency: string;
  balance: number;
}

export interface CreateProgressInput {
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  lastCheckedDate?: Date;
}

export interface UpdateProgressPatch {
  progress?: number;
  completed?: boolean;
  lastCheckedDate?: Date;
}

export interface IChallengeRepository {
  userExists(userId: string): Promise<boolean>;
  findActiveChallengesByCategory(
    category: string,
    now: Date
  ): Promise<ChallengeRecord[]>;
  findUserWallets(userId: string): Promise<ChallengeWalletRecord[]>;
  findProgress(
    userId: string,
    challengeId: string
  ): Promise<UserChallengeProgressRecord | null>;
  createProgress(
    input: CreateProgressInput
  ): Promise<UserChallengeProgressRecord>;
  updateProgress(
    id: string,
    patch: UpdateProgressPatch
  ): Promise<UserChallengeProgressRecord>;
  incrementUserExp(userId: string, exp: number): Promise<void>;
  countChallenges(): Promise<number>;
  findChallengesPage(skip: number, limit: number): Promise<ChallengeRecord[]>;
  findUserProgressList(userId: string): Promise<UserChallengeProgressRecord[]>;
}

export interface ChallengeServiceDeps {
  repo: IChallengeRepository;
  exchangeRate: (src: string, dest: string) => Promise<{ rate: number }>;
  updateUserRank: (userId: string) => Promise<void>;
}

export interface CheckBalanceChallengesResult {
  success: boolean;
  updated: number;
  completedChallenges: string[];
}

export type TrackChallengeProgressResult = CheckBalanceChallengesResult;

export interface GetChallengesListItem {
  _id: string;
  title: string;
  description: string;
  exp: number;
  startDate: Date;
  endDate: Date;
  category: string;
  progress: number;
  amountToGoal: number;
  userProgress?: UserChallengeProgressRecord[];
}

export interface GetChallengesResult {
  success: boolean;
  challenge: GetChallengesListItem[];
  currentPage: number;
  totalPayments: number;
  totalPages: number;
}
