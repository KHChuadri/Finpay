import User from "../../model/User";
import { Ranks } from "../ranks";

/**
 * <Update and change User's Account rank>
 * 
 * @param {string} userId 
 */
export const updateUserRank = async (userId: string) => {
  const updatedUser = await User.findById(userId);
  if (updatedUser) {
    let newRank = updatedUser.rank;

    for (const rank of [...Ranks].sort((a, b) => b.threshold - a.threshold)) {
      if (updatedUser.exp >= rank.threshold) {
        newRank = rank.name;
        break;
      }
    }

    if (newRank !== updatedUser.rank) {
      updatedUser.rank = newRank;
      await updatedUser.save();
    }
  }
};
