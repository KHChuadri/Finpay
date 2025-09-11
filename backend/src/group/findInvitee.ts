import Groups from "../../model/Groups";
import Invitation from "../../model/Invitation";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <find the target invitee from email>
 * 
 * @param {string} email 
 * @param {string} userId 
 * @param {string} groupId 
 * @returns recepient userId
 */
export const findInvitee = async (
  email: string,
  userId: string,
  groupId: string
) => {
  const self = await User.findById(userId);
  const recipient = await User.findOne({ email });
  const group = await Groups.findById(groupId);

  if (!recipient) {
    throw HTTPError(404, "Recipient not found.");
  }

  if (group?.admin.toString() !== userId.toString()) {
    throw HTTPError(400, "You Need To Be An Admin To Invite");
  }

  if (self!.email == recipient!.email) {
    throw HTTPError(400, "Cannot Invite Oneself");
  }

  if (
    group?.members.find(
      (memberId) => memberId.toString() === recipient._id.toString()
    )
  ) {
    throw HTTPError(400, "This Person is Already Part Of The Group");
  }

  // check if user is already invited
  const InvitationList = await Invitation.find({
      _id: { $in: group.pendingInvite },
  });

  if (InvitationList.some((invite) => invite.receiver.toString() === recipient._id.toString())) {
    throw HTTPError(400, "This Person already has a pending invite");
  }

  return recipient._id.toString();
};
