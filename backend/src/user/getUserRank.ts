import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Get user's Account Rank>
 * 
 * @param {string} userId 
 * @returns {rank : string} object with user's rank
 */
export const getUserRank = async (userId: string) => {
  if (!userId) {
    throw HTTPError(400, "getUserRank: missing required field: userId");
  }

  const correspondingUser = await User.findById(userId);

  if (!correspondingUser) {
    throw HTTPError(404, `getUserRank: User with id ${userId} not found!`);
  }

  return {
    rank: correspondingUser.rank
  }
}