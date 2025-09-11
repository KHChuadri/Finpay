import User from "../../model/User";
import Groups from "../../model/Groups";
import mongoose from "mongoose";
import HTTPError from "http-errors";

/**
 * <Create New Group>
 * 
 * @param {string} groupName 
 * @param {string} description 
 * @param {string} creator 
 * @param {string} currency 
 * @returns {groupId: string} object containing new group id
 */
export const setGroup = async (
  groupName: string,
  description: string,
  creator: string,
  currency: string,
) => {
  const adminObjectId = new mongoose.Types.ObjectId(creator);
  const user = await User.findById(creator);

  if (!user) {
    throw HTTPError(404, "User user not found");
  }

  // Saving new Group
  const newGroup = new Groups({
    groupName,
    description,
    admin: adminObjectId,
    transactionHistory: [],
    members: [],
    pendingInvite: [],
    walletCurrency: currency,
  });

  await newGroup.save();

  newGroup.members.push(adminObjectId);
  user.groups.push(newGroup._id);
  await newGroup.save();
  await user.save();

  return {
    groupId: newGroup._id.toString(),
  };
};
