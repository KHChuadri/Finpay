import User from "../../model/User";
import HTTPError from "http-errors";
import bcrypt from "bcrypt";

/**
 * <Process Reset Password and Change Current User's Password>
 * 
 * @param {string} token 
 * @param {string} newPassword 
 * @returns { success: boolean, user: User Object } object containing process status and new User Object
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpiryDate: { $gt: Date.now() },
  });

  if (!user) {
    throw HTTPError(410, "Reset password token has expired.");
  }

  // Check if this password has been used before
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const isCurrPasswordSame = await bcrypt.compare(newPassword, user.password);

  if (isCurrPasswordSame) {
    throw HTTPError(400, "New password cannot be the same with current password");
  }

  // Check is password have been the same
  for (const existingPassword of user.existingPassword) {
    if (await bcrypt.compare(newPassword, existingPassword)) {
      throw HTTPError(409, "This password has been used before. Please enter a new password");
    }
  }

  user.existingPassword.push(user.password);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiryDate = undefined;

  await user.save();

  return { success: true, user: user };
};
