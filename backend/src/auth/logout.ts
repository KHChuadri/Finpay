import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <get rid of token during log out>
 * 
 * @param {string} token 
 * @param {string} userId 
 * @returns 
 */
export const logout = async (token: string, userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  const index = findUser.tokens.findIndex((t) => t == token);
  if (index === -1) {
    await findUser.save();
    return {};
  }
  findUser.tokens.splice(index, 1);
  await findUser.save();

  return {};
};
