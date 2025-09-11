import bcrypt from "bcrypt";
import User from "../../model/User";
import HTTPError from "http-errors";
import jwt from "jsonwebtoken";
import WalletInfo from "../../model/WalletInfo";
import { UUID } from "mongodb";

/**
 * <create new user during registration>
 * 
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} email 
 * @param {string} password 
 * @returns { token: string, userId: string } object with userid and active token
 */
export const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw HTTPError(400, "Corresponding email has been used.");
  }

  let depositId: string = new UUID().toString();
  while ((await User.findOne({ depositId: depositId })) != null) {
    depositId = new UUID().toString();
  }
  // Saving new User
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    passwordLength: password.length,
    walletInfo: [],
    tokens: [],
    depositId: depositId,
  });
  await newUser.save();

  // After user registered, automatically make AUD currecncy wallet
  const newWalletInfo = new WalletInfo({
    walletCurrency: "AUD",
    walletBalance: 100,
    userId: newUser._id,
  });
  await newWalletInfo.save();

  newUser.walletInfo.push(newWalletInfo._id);
  await newUser.save();

  const secret = process.env.JWT_SECRET!;

  const token = jwt.sign({ userId: newUser._id, email: newUser.email }, secret);

  newUser.tokens.push(token);
  await newUser.save();

  return {
    token: token,
    userId: newUser._id.toString(),
  };
};
