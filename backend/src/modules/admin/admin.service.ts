import HTTPError from "http-errors";
import type {
  AdminServiceDeps,
  AdminUserDoc,
  AdminUserListResult,
  AdminRequestListResult,
  CheckAllBalanceChallengesResult,
  CreateChallengeInput,
  CreateChallengeResult,
} from "./admin.types";

export const createAdminService = (deps: AdminServiceDeps) => {
  const { repo, checkBalanceChallenges } = deps;

  const getUsers = async (
    page: number,
    limit: number
  ): Promise<AdminUserListResult> => {
    const skip = (page - 1) * limit;

    const userDocs = await repo.findUsersPage(skip, limit);
    const totalUsers = await repo.countUsers();

    const users = userDocs.map((user) => ({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userId: user._id.toString(),
      isLocked: user.isLocked,
      isVerified: user.isVerified,
      email: user.email,
      updatedAt: user.updatedAt.toISOString(),
      KYCimg: user.KYCimg,
    }));

    return {
      users,
      currentPage: page,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    };
  };

  const getRequests = async (
    page: number,
    limit: number
  ): Promise<AdminRequestListResult> => {
    const skip = (page - 1) * limit;

    const requestDocs = await repo.findWithdrawRequestsPage(skip, limit);

    let totalRequest = requestDocs.length;

    const requests = requestDocs.map((request) => ({
      itemid: request._id.toString(),
      name: request.name,
      transactionId: request.transactionId,
      currency: request.currency,
      amount: request.amount,
      userId: request.userId.toString(),
    }));

    if (totalRequest === 0) {
      totalRequest = 1;
    }

    return {
      requests,
      currentPage: page,
      totalRequest,
      totalPages: Math.ceil(totalRequest / limit),
    };
  };

  const verifyUser = async (
    userId: string,
    verify: boolean
  ): Promise<AdminUserDoc> => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    user.isVerified = verify;
    user.save();

    return user;
  };

  const blockUser = async (
    userId: string,
    block: boolean
  ): Promise<AdminUserDoc> => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    user.isLocked = block;
    user.save();

    return user;
  };

  const createChallenge = async (
    input: CreateChallengeInput
  ): Promise<CreateChallengeResult> => {
    const { category, title, description, startDate, endDate, exp, amountToGoal } =
      input;

    const requiredFields = {
      category,
      title,
      description,
      startDate,
      endDate,
      exp,
      amountToGoal,
    };
    const isMissing = (v: unknown) =>
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim().length === 0) ||
      (typeof v === "number" && Number.isNaN(v));

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => isMissing(value))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw HTTPError(
        400,
        `adminCreateChallenge: required field(s) [${missingFields.join(
          ", "
        )}] are missing`
      );
    }

    const validCategories = ["pay", "recieve", "save"];
    if (!validCategories.includes(category)) {
      throw HTTPError(
        400,
        `adminCreateChallenge: Invalid category: ${category}`
      );
    }

    if (endDate <= startDate) {
      throw HTTPError(
        400,
        `adminCreateChallenge: end date must be later than start date. (${endDate} <= ${startDate})`
      );
    }

    const newChallenge = await repo.createChallenge({
      category,
      title,
      description,
      startDate,
      endDate,
      exp,
      amountToGoal,
    });

    return {
      success: true,
      newChallenge,
    };
  };

  const checkAllBalanceChallenges =
    async (): Promise<CheckAllBalanceChallengesResult> => {
      const userIds = await repo.findActiveUserIds();
      const results: unknown[] = [];

      for (const userId of userIds) {
        try {
          const result = await checkBalanceChallenges(userId);
          results.push({ userId, ...(result as object) });
        } catch (error) {
          results.push({
            userId,
            success: false,
            error,
          });
        }
      }

      return {
        success: true,
        totalUsers: userIds.length,
        results,
      };
    };

  return {
    getUsers,
    getRequests,
    verifyUser,
    blockUser,
    createChallenge,
    checkAllBalanceChallenges,
  };
};
