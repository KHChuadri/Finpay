import Groups from "../../model/Groups";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Get Member Of A Group>
 * 
 * @param {string} groupId 
 * @returns List of Member (User) type
 */
export const getMemberList = async (groupId: string) => {
  const findGroups = await Groups.findById(groupId);

  if (!findGroups) {
    throw HTTPError(400, "Groups not found or does not exist");
  }

  if (!Array.isArray(findGroups.members)) {
    throw HTTPError(400, "Groups has no member list");
  }

  const MemberList = await User.find({
    _id: { $in: findGroups.members },
  }).select("firstName lastName email");

  const members = MemberList.map((user) => ({
    id: user._id.toString(),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role:
      findGroups.admin.toString() === user._id.toString() ? "Admin" : "Member",
  }));

  return members;
};
