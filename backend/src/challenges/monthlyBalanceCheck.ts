import cron from "node-cron";
import { getDb } from "../../lib/db";
import { users as usersTable } from "../db/schema";
import { challengeService } from "../modules/challenge/challenge.container";

const { checkBalanceChallenges } = challengeService;

/**
 * <Checks User's End Balance for Saving Challenges>
 * <Run at 00:01 on the first day of every month>
 */
export const initializeMonthlyBalanceCheck = () => {
  cron.schedule("1 0 1 * *", async () => {

    try {
      // Get all users (legacy filtered on a non-existent `isActive` field,
      // which always matched nothing; iterate every user, the evident intent).
      const users = await getDb().select({ id: usersTable.id }).from(usersTable);

      for (const user of users) {
        try {
          await checkBalanceChallenges(user.id);
        } catch (error) {
          console.error(
            `Error checking balance challenges for user ${user.id}:`,
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
