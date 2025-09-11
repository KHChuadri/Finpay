import Groups from "../../model/Groups";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Get a list of group that the user are a part of>
 * 
 * @param {string} userId 
 * @returns List of Group Informations
 */
export const getGroupList = async (userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  if (!Array.isArray(findUser.groups)) {
    throw HTTPError(400, "User has no group list");
  }

  const GroupList = await Groups.find({
    _id: { $in: findUser.groups },
  });

  return GroupList;
};
