import { getDb } from "../../lib/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { Ranks } from "../ranks";

/**
 * <Update and change User's Account rank>
 *
 * @param {string} userId
 */
export const updateUserRank = async (userId: string) => {
  const [user] = await getDb()
    .select({ id: users.id, exp: users.exp, rank: users.rank })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return;

  let newRank = user.rank;
  for (const rank of [...Ranks].sort((a, b) => b.threshold - a.threshold)) {
    if (user.exp >= rank.threshold) {
      newRank = rank.name as typeof user.rank;
      break;
    }
  }

  if (newRank !== user.rank) {
    await getDb().update(users).set({ rank: newRank }).where(eq(users.id, userId));
  }
};
