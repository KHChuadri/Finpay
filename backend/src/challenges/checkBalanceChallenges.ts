import UserChallengeProgress from "../../model/UserChallengeProgress";
import Challenge from "../../model/Challenge";
import User from "../../model/User";
import { updateUserRank } from "../user/updateUserRank";
import WalletInfo from "../../model/WalletInfo";
import { exchangeRate } from "../exchangeRate";

/**
 * <Check User's progress on balance challenges update if there are any progress>
 * 
 * @param {string} userId 
 * @returns {success: boolean, updated: number,
 * completedChallenges: [String]} Object containing newly updated user challenge progress
 */
export const checkBalanceChallenges = async (userId: string) => {
  const now = new Date();
  
  // Find active "save" challenges
  const activeSaveChallenges = await Challenge.find({
    category: "save",
    startDate: { $lte: now },
    endDate: { $gt: now },
  });

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  let currentBalance = 0; // Assuming you have a balance field
  const userWallet = await WalletInfo.find({ userId: user._id });
  
  for (const wallet of userWallet) {
    if (wallet.walletCurrency !== "AUD") {
      const rateToAud = await exchangeRate(wallet.walletCurrency, "AUD");
      const balanceInAud = wallet.walletBalance * rateToAud.rate;
      currentBalance += balanceInAud;
    }
  }
  
  const completedChallengeIds: string[] = [];

  for (const challenge of activeSaveChallenges) {
    const existing = await UserChallengeProgress.findOne({
      userId,
      challengeId: challenge._id,
    });

    if (existing?.completed) {
      continue;
    }

    // For save challenges, we check if current balance meets the goal
    const meetsGoal = currentBalance >= challenge.amountToGoal;

    if (!existing) {
      const newProgress = new UserChallengeProgress({
        userId,
        challengeId: challenge._id,
        progress: currentBalance, // Store current balance as progress
        completed: meetsGoal,
        lastCheckedDate: now, // Track when we last checked
      });

      if (meetsGoal) {
        completedChallengeIds.push(challenge._id.toString());
        await User.findByIdAndUpdate(userId, {
          $inc: { exp: Number(challenge.exp) },
        });
      }

      await newProgress.save();
    } else {
      // Update progress with current balance
      existing.progress = currentBalance;
      
      // Check if this is a new month since last check
      const lastChecked = existing.lastCheckedDate || existing.createdAt;
      const isNewMonth = lastChecked.getMonth() !== now.getMonth() || 
                        lastChecked.getFullYear() !== now.getFullYear();

      // Only complete the challenge if it's a new month and balance meets goal
      if (isNewMonth && meetsGoal && !existing.completed) {
        existing.completed = true;
        existing.lastCheckedDate = now;
        completedChallengeIds.push(challenge._id.toString());

        await User.findByIdAndUpdate(userId, {
          $inc: { exp: challenge.exp },
        });
      } else if (isNewMonth) {
        // Update last checked date even if challenge isn't completed
        existing.lastCheckedDate = now;
      }

      await existing.save();
    }
  }

  await updateUserRank(userId);

  return {
    success: true,
    updated: activeSaveChallenges.length,
    completedChallenges: completedChallengeIds,
  };
};