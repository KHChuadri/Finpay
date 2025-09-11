import UserChallengeProgress from "../../model/UserChallengeProgress";
import Challenge from "../../model/Challenge";
import User from "../../model/User";
import { updateUserRank } from "../user/updateUserRank";
import { checkBalanceChallenges } from "./checkBalanceChallenges";

/**
 * <Track User Challenge Progress>
 * 
 * @param {string} category 
 * @param {string} userId 
 * @param {number} amount 
 * @returns {success: boolean, updated: number,
 * completedChallenges: [String]} Object containing newly updated user challenge progress
 */
export const trackChallengeProgress = async (
  category: string,
  userId: string,
  amount: number
) => {
  // Handle save challenges separately
  if (category === "save") {
    return await checkBalanceChallenges(userId);
  }

  // Handle pay and receive challenges
  const now = new Date();
  const activeChallenges = await Challenge.find({
    category: category,
    startDate: { $lte: now },
    endDate: { $gt: now },
  });

  const completedChallengeIds: string[] = [];

  for (const challenge of activeChallenges) {
    const existing = await UserChallengeProgress.findOne({
      userId,
      challengeId: challenge._id,
    });

    if (existing?.completed) {
      continue;
    }

    if (!existing) {
      const newProgress = new UserChallengeProgress({
        userId,
        challengeId: challenge._id,
        progress: amount,
        completed: false,
      });

      if (amount >= challenge.amountToGoal) {
        newProgress.completed = true;
        completedChallengeIds.push(challenge._id.toString());

        await User.findByIdAndUpdate(userId, {
          $inc: { exp: Number(challenge.exp) },
        });
      }

      await newProgress.save();
    } else {
      existing.progress += amount;
      if (existing.progress >= challenge.amountToGoal && !existing.completed) {
        existing.completed = true;
        completedChallengeIds.push(challenge._id.toString());

        await User.findByIdAndUpdate(userId, {
          $inc: { exp: challenge.exp },
        });
      }

      await existing.save();
    }
  }

  await updateUserRank(userId);

  return {
    success: true,
    updated: activeChallenges.length,
    completedChallenges: completedChallengeIds,
  };
};