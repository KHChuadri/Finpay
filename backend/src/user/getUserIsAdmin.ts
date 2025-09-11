import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Check if user is admin>
 * 
 * @param {string} userId 
 * @returns {
 *   success: boolean,
 *   isAdmin: boolean
 * } object with status and if user is admin
 */
export const getUserIsAdmin = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw HTTPError(404, `getUserIsAdmin: User with id ${userId} not found`);
  }

  return {
    success: true,
    isAdmin: user.isAdmin
  }
}