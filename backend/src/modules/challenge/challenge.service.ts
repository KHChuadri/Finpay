import HTTPError from "http-errors";
import type {
  ChallengeServiceDeps,
  CheckBalanceChallengesResult,
  GetChallengesResult,
  TrackChallengeProgressResult,
} from "./challenge.types";

export const createChallengeService = (deps: ChallengeServiceDeps) => {
  const { repo, exchangeRate, updateUserRank } = deps;

  const checkBalanceChallenges = async (
    userId: string
  ): Promise<CheckBalanceChallengesResult> => {
    const now = new Date();

    // Find active "save" challenges
    const activeSaveChallenges = await repo.findActiveChallengesByCategory(
      "save",
      now
    );

    const exists = await repo.userExists(userId);
    if (!exists) {
      // Preserves legacy behavior: a plain Error (not an HTTPError), so
      // callers that translate via handleHTTPError fall back to a generic
      // 500 response, matching the pre-migration route exactly.
      throw new Error(`User ${userId} not found`);
    }

    let currentBalance = 0; // Assuming you have a balance field
    const userWallets = await repo.findUserWallets(userId);

    for (const wallet of userWallets) {
      if (wallet.currency !== "AUD") {
        const rateToAud = await exchangeRate(wallet.currency, "AUD");
        const balanceInAud = wallet.balance * rateToAud.rate;
        currentBalance += balanceInAud;
      }
    }

    const completedChallengeIds: string[] = [];

    for (const challenge of activeSaveChallenges) {
      const existing = await repo.findProgress(userId, challenge._id);

      if (existing?.completed) {
        continue;
      }

      // For save challenges, we check if current balance meets the goal
      const meetsGoal = currentBalance >= challenge.amountToGoal;

      if (!existing) {
        if (meetsGoal) {
          completedChallengeIds.push(challenge._id);
          await repo.incrementUserExp(userId, Number(challenge.exp));
        }

        await repo.createProgress({
          userId,
          challengeId: challenge._id,
          progress: currentBalance,
          completed: meetsGoal,
          lastCheckedDate: now,
        });
      } else {
        // Check if this is a new month since last check
        const lastChecked = existing.lastCheckedDate || existing.createdAt!;
        const isNewMonth =
          lastChecked.getMonth() !== now.getMonth() ||
          lastChecked.getFullYear() !== now.getFullYear();

        // Only complete the challenge if it's a new month and balance meets goal
        if (isNewMonth && meetsGoal && !existing.completed) {
          completedChallengeIds.push(challenge._id);
          await repo.incrementUserExp(userId, challenge.exp);
          await repo.updateProgress(existing._id, {
            progress: currentBalance,
            completed: true,
            lastCheckedDate: now,
          });
        } else if (isNewMonth) {
          // Update last checked date even if challenge isn't completed
          await repo.updateProgress(existing._id, {
            progress: currentBalance,
            lastCheckedDate: now,
          });
        } else {
          await repo.updateProgress(existing._id, {
            progress: currentBalance,
          });
        }
      }
    }

    await updateUserRank(userId);

    return {
      success: true,
      updated: activeSaveChallenges.length,
      completedChallenges: completedChallengeIds,
    };
  };

  const trackChallengeProgress = async (
    category: string,
    userId: string,
    amount: number
  ): Promise<TrackChallengeProgressResult> => {
    // Handle save challenges separately
    if (category === "save") {
      return await checkBalanceChallenges(userId);
    }

    // Handle pay and receive challenges
    const now = new Date();
    const activeChallenges = await repo.findActiveChallengesByCategory(
      category,
      now
    );

    const completedChallengeIds: string[] = [];

    for (const challenge of activeChallenges) {
      const existing = await repo.findProgress(userId, challenge._id);

      if (existing?.completed) {
        continue;
      }

      if (!existing) {
        let completed = false;

        if (amount >= challenge.amountToGoal) {
          completed = true;
          completedChallengeIds.push(challenge._id);
          await repo.incrementUserExp(userId, Number(challenge.exp));
        }

        await repo.createProgress({
          userId,
          challengeId: challenge._id,
          progress: amount,
          completed,
        });
      } else {
        const newProgress = existing.progress + amount;

        if (newProgress >= challenge.amountToGoal && !existing.completed) {
          completedChallengeIds.push(challenge._id);
          await repo.incrementUserExp(userId, challenge.exp);
          await repo.updateProgress(existing._id, {
            progress: newProgress,
            completed: true,
          });
        } else {
          await repo.updateProgress(existing._id, { progress: newProgress });
        }
      }
    }

    await updateUserRank(userId);

    return {
      success: true,
      updated: activeChallenges.length,
      completedChallenges: completedChallengeIds,
    };
  };

  const getChallenges = async (
    userId: string,
    page: number,
    limit: number
  ): Promise<GetChallengesResult> => {
    const skip = (page - 1) * limit;

    const exists = await repo.userExists(userId);
    if (!exists) {
      throw HTTPError(404, "getChallenges: User not found");
    }

    // Get ALL challenges from the Challenge collection
    const totalDocuments = await repo.countChallenges();

    // Fetch all challenges with pagination
    const allChallenges = await repo.findChallengesPage(skip, limit);

    // Get user progress for all challenges
    const userProgressList = await repo.findUserProgressList(userId);

    // Create a map for quick lookup of user progress
    const progressMap = new Map<string, (typeof userProgressList)[number]>();
    userProgressList.forEach((progress) => {
      progressMap.set(progress.challengeId?.toString(), progress);
    });

    // Combine challenge data with user progress
    const challengeList = allChallenges.map((challenge) => {
      const userProgress = progressMap.get(challenge._id.toString());

      return {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        exp: challenge.exp,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        category: challenge.category,
        progress: 0, // Default progress for challenge display
        amountToGoal: challenge.amountToGoal, // Make sure to include this field
        userProgress: userProgress
          ? [
              {
                _id: userProgress._id,
                userId: userProgress.userId,
                challengeId: userProgress.challengeId,
                progress: userProgress.progress,
                completed: userProgress.completed,
                lastCheckedDate: userProgress.lastCheckedDate,
                createdAt: userProgress.createdAt,
                updatedAt: userProgress.updatedAt,
              },
            ]
          : undefined,
      };
    });

    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      success: true,
      challenge: challengeList,
      currentPage: page,
      totalPayments: totalDocuments,
      totalPages: totalPages,
    };
  };

  return { checkBalanceChallenges, trackChallengeProgress, getChallenges };
};
