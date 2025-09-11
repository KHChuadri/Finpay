import mongoose from "mongoose";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Blocks the user by admin>
 * 
 * @param {string} userId 
 * @param {boolean} block 
 * @returns User Object
 */
export const adminBlockId = async (userId: string, block: boolean) => {
  const user = await User.findById(new mongoose.Types.ObjectId(userId));

  if (!user) {
    throw HTTPError(404, "User not found");
  }

  user.isLocked = block;
  user.save();
  return user;
};
