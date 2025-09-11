import bcrypt from "bcrypt";
import HTTPError from "http-errors";
import User from "../../model/User";

/**
 * <Validate login information>
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns { userId: string } object containing userid
 */
export const login = async (email: string, password: string) => {
  if (!email || !password || email.trim().length === 0 || password.trim().length === 0) {
    throw HTTPError(400, "Email and password are required");
  }

  const targetUser = await User.findOne({ email });

  if (!targetUser) {
    throw HTTPError(404, "Account does not exist with the given email");
  }

  const matchedPassword = await bcrypt.compare(password, targetUser.password);

  if (!matchedPassword) {
    throw HTTPError(400, "Incorrect password");
  }

  return { userId: targetUser._id.toString() };
};
