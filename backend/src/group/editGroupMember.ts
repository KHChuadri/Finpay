import mongoose from "mongoose";
import HTTPError from "http-errors";
import Groups from "../../model/Groups";
import User from "../../model/User";
import Invitation from "../../model/Invitation";
import Notification from "../../model/Notification";

/**
 * <Handle Member Removal or Member Invitation>
 * 
 * @param {string} groupId 
 * @param {string} target 
 * @param {string} mode 
 * @param {string} actor 
 * @returns {message: string} "Group updated"
 */
export const editGroupMember = async (
  groupId: string,
  target: string,
  mode: string,
  actor: string
) => {
  const group = await Groups.findById(new mongoose.Types.ObjectId(groupId));
  const member = await User.findById(new mongoose.Types.ObjectId(target));
  const user = await User.findById(new mongoose.Types.ObjectId(actor));
  if (!group) {
    throw HTTPError(404, "group not found");
  }
  if (!member) {
    throw HTTPError(404, "User not found");
  }
  if (actor !== group.admin.toString()) {
    throw HTTPError(400, "User is not the admin");
  }
  if (!user) {
    throw HTTPError(404, "User not found");
  }
  if (mode === "add") {
    // check if already part of the group
    if (
      group.members.find(
        (memberId) => memberId.toString() === member!._id.toString()
      )
    ) {
      throw HTTPError(400, "This Person is Already Part Of The Group");
    }

    // check if user is already invited
    const InvitationList = await Invitation.find({
        _id: { $in: group.pendingInvite },
    });

    if (InvitationList.some((invite) => invite.receiver.toString() === target)) {
      throw HTTPError(400, "This Person already has a pending invite");
    }
  
    const newInvitation = new Invitation({
      groupName: group.groupName,
      groupId: new mongoose.Types.ObjectId(group._id),
      sender: new mongoose.Types.ObjectId(actor),
      receiver: new mongoose.Types.ObjectId(target),
      senderName: `${user.firstName} ${user.lastName}`,
      receiverName: `${member.firstName} ${member.lastName}`,
    });

    const newNotification = new Notification({
      type: "Invitation",
      sender: new mongoose.Types.ObjectId(actor),
      receiver: new mongoose.Types.ObjectId(target),
      description: `${user.firstName} ${user.lastName} Invites You To join ${group.groupName}`,
      createdAt: new Date(),
    });
    await newNotification.save();
    await newInvitation.save();

    member.invitation.push(newInvitation._id);
    group.pendingInvite.push(newInvitation._id);
    member.notification.push(newNotification._id);
  } else if (mode === "remove") {
    if (group.admin.toString() === target) {
      throw HTTPError(400, "You Cannot Remove Yourself");
    }
    group.members = group.members.filter(
      (member) => member.toString() !== target
    );
    member.groups = member.groups.filter(
      (group) => group.toString() !== groupId.toString()
    );
  }

  await group.save();
  await member.save();

  return { message: "Group updated" };
};
