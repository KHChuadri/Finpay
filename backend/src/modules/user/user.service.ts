import HTTPError from "http-errors";
import type { UserServiceDeps } from "./user.types";

export const createUserService = (deps: UserServiceDeps) => {
  const { repo } = deps;

  /** Mirrors legacy getUserRank. */
  const getUserRank = async (userId: string) => {
    if (!userId) {
      throw HTTPError(400, "getUserRank: missing required field: userId");
    }

    const user = await repo.findUserRankById(userId);
    if (!user) {
      throw HTTPError(404, `getUserRank: User with id ${userId} not found!`);
    }

    return { rank: user.rank };
  };

  /** Mirrors legacy getUserIsAdmin. */
  const getUserIsAdmin = async (userId: string) => {
    const user = await repo.findUserAdminById(userId);
    if (!user) {
      throw HTTPError(404, `getUserIsAdmin: User with id ${userId} not found`);
    }

    return { success: true, isAdmin: user.isAdmin };
  };

  /** Mirrors legacy getUserTransactionHistory. */
  const getUserTransactionHistory = async (userId: string) => {
    const user = await repo.findUserWithTransactionHistory(userId);
    if (!user) {
      throw HTTPError(400, "User not found or does not exist");
    }

    return repo.findTransactionHistoryByIds(user.transactionHistory);
  };

  return {
    getUserRank,
    getUserIsAdmin,
    getUserTransactionHistory,
  };
};
