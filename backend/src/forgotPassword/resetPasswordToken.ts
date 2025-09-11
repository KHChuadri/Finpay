import HTTPError from "http-errors";
import User from "../../model/User";

/**
 * <Find User From Reset Password Token>
 * 
 * @param {string} token 
 * @returns {success: boolean} object containg request status
 */
export const resetPasswordToken = async (token: string) => {
  const user = await User.findOne({
    resetPasswordToken: token
  })
  
  if (!user) {
    throw HTTPError(404, "Couldn't find user");
  }

  if (user.resetPasswordToken !== token || !token) {
    throw HTTPError(404, "Link does not exists");
  }
  
  if (user.resetPasswordTokenExpiryDate === undefined || !user.resetPasswordTokenExpiryDate) {
    throw HTTPError(405, "Link has expired")
  }

  return { success: true }
}
