import mongoose from "mongoose";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Verify User by Admin>
 * 
 * @param userId 
 * @param verify 
 * @returns User Object
 */
export const adminVerifyId = async (userId: string, verify: boolean) => {
  const user = await User.findById(new mongoose.Types.ObjectId(userId));

  if (!user) {
    throw HTTPError(404, "User not found");
  }

  user.isVerified = verify;
  user.save();
  return user;
};
