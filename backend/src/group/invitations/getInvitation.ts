import User from "../../../model/User";
import Invitation from "../../../model/Invitation";
import HTTPError from "http-errors";

/**
 * <Get Invitation that is received by user>
 * 
 * @param {string} userId 
 * @returns List of Invitation
 */
export const getInvitationList = async (userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  if (!Array.isArray(findUser.invitation)) {
    throw HTTPError(400, "User has no invitation list");
  }

  const InvitationList = await Invitation.find({
    _id: { $in: findUser.invitation },
  });

  return InvitationList;
};
