import bcrypt from "bcrypt";
import HTTPError from "http-errors";
import jwt from "jsonwebtoken";
import User from "../../model/User";

/**
 * <Login for admin account>
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns  { token: string, userId: string } object returning admin's userid and active token
 */
export const adminLogin = async (email: string, password: string) => {
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

  const secret = process.env.JWT_SECRET!;

  const token = jwt.sign({ email: targetUser.email }, secret);

  targetUser.tokens.push(token);
  await targetUser.save();

  if (!targetUser.isAdmin) {
    throw HTTPError(400, `User is not an admin`);
  }

  const userId = targetUser._id.toString();

  return { token: token, userId: userId };
};
