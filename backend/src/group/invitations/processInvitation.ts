import mongoose from "mongoose";
import HTTPError from "http-errors";
import Groups from "../../../model/Groups";
import User from "../../../model/User";
import Invitation from "../../../model/Invitation";

/**
 * <Process Invitation by either rejecting or accepting>
 * 
 * @param {string} invitationId 
 * @param {string} mode 
 * @returns { message: string } object containing message: "Invitation Processed"
 */
export const processInvitation = async (invitationId: string, mode: string) => {
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

  if (mode === "accept") {
    group.members.push(invitation.receiver);
    member.groups.push(invitation.groupId);
    member.invitation = member.invitation.filter(
      (inviteId) => inviteId.toString() !== invitationId.toString()
    );  
    group.pendingInvite = group.pendingInvite.filter(
      (inviteId) => inviteId.toString() !== invitationId.toString()
    );
    await Invitation.findOneAndDelete({
      _id: invitation._id,
    });
  } else if (mode === "reject") {
    member.invitation = member.invitation.filter(
      (inviteId) => inviteId.toString() !== invitationId.toString()
    );
    group.pendingInvite = group.pendingInvite.filter(
      (inviteId) => inviteId.toString() !== invitationId.toString()
    );
    await Invitation.findOneAndDelete({
      _id: invitation._id,
    });
  }

  await group.save();
  await member.save();

  return { message: "Invitation Processed" };
};
