import mongoose from "mongoose";
import HTTPError from "http-errors";
import Groups from "../../model/Groups";
import User from "../../model/User";

/**
 * <Handle User Leaving Group>
 * 
 * @param {string} groupId 
 * @param {string} actor 
 * @returns { message: string } object with "Successfully Left Group" message
 */
export const leaveGroup = async (groupId: string, actor: string) => {
  const group = await Groups.findById(new mongoose.Types.ObjectId(groupId));
  const user = await User.findById(new mongoose.Types.ObjectId(actor));
  if (!group) {
    throw HTTPError(404, "group not found");
  }
  if (!user) {
    throw HTTPError(404, "User not found");
  } if (group.members.length === 1 && group.walletBalance != 0) {
    throw HTTPError(404, "You Are The Only Member Left And Wallet Balance Is Not Empty");
  }

  user.groups = user.groups.filter((group) => group._id.toString() !== groupId);
  group.members = group.members.filter((member) => member.toString() !== actor);

  if (group.members.length === 0) {
    await group.deleteOne();
  } else if (group.admin.toString() === actor) {
    group.admin = group.members[0];
    await group.save();
  } else {
    await group.save();
  }

  await user.save();

  return { message: "Successfully Left Group" };
};
