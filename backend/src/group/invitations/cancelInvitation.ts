import mongoose from "mongoose";
import HTTPError from "http-errors";
import Groups from "../../../model/Groups";
import User from "../../../model/User";
import Invitation from "../../../model/Invitation";

/**
 * <Cancel Pending Invitation>
 * 
 * @param {string} invitationId 
 * @returns { message: string } object containing message stating "Invitation Cancelled"
 */
export const cancelInvitation = async (invitationId: string) => {
  const invitation = await Invitation.findById(
    new mongoose.Types.ObjectId(invitationId)
  );
  if (!invitation) {
    throw HTTPError(404, "invitation not found");
  }
  const group = await Groups.findById(invitation.groupId);
  const member = await User.findById(invitation.receiver);

  if (!group) {
    throw HTTPError(404, "Group not found");
  }
  if (!member) {
    throw HTTPError(404, "User not found");
  }

  // remove invitation from member invite
  member.invitation = member.invitation.filter(
    (inviteId) => inviteId.toString() !== invitationId.toString()
  );
  // remove invitation from group pending invite
  group.pendingInvite = group.pendingInvite.filter(
    (inviteId) => inviteId.toString() !== invitationId.toString()
  );
  await Invitation.findOneAndDelete({
    _id: invitation._id,
  });

  await group.save();
  await member.save();

  return { message: "Invitation Cancelled" };
};
