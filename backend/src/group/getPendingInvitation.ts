import Invitation from "../../model/Invitation";
import Groups from "../../model/Groups";
import HTTPError from "http-errors";

/**
 * <Get Group's Invitation List>
 * 
 * @param {string} groupId 
 * @returns Group Invitation List
 */
export const getPendingInvitation = async (groupId: string) => {
  const findGroup = await Groups.findById(groupId);

  if (!findGroup) {
    throw HTTPError(400, "User not found or does not exist");
  }

  if (!Array.isArray(findGroup.pendingInvite)) {
    throw HTTPError(400, "User has no invitation list");
  }

  const InvitationList = await Invitation.find({
    _id: { $in: findGroup.pendingInvite },
  });

  return InvitationList;
};
