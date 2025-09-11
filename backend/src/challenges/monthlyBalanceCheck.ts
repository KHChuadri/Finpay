import cron from "node-cron";
import User from "../../model/User";
import { checkBalanceChallenges } from "./checkBalanceChallenges";

/**
 * <Checks User's End Balance for Saving Challenges>
 * <Run at 00:01 on the first day of every month>
 */
export const initializeMonthlyBalanceCheck = () => {
  cron.schedule("1 0 1 * *", async () => {

    try {
      // Get all active users
      const users = await User.find({ isActive: true }); // Adjust query as needed

      for (const user of users) {
        try {
          await checkBalanceChallenges(user._id.toString());
        } catch (error) {
          console.error(
            `Error checking balance challenges for user ${user._id}:`,
            error
          );
        }
      }

    } catch (error) {
      console.error("Error in monthly balance check:", error);
    }
  });
};

// Optional: Function to manually trigger balance check for a specific user
export const manualBalanceCheck = async (userId: string) => {
  try {
    const result = await checkBalanceChallenges(userId);
    return result;
  } catch (error) {
    console.error(`Error in manual balance check for user ${userId}:`, error);
    throw error;
  }
};
