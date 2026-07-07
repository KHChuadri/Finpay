import { groupService } from "../modules/group/group.container";

/**
 * <Get a list of group that the user are a part of>
 *
 * @param {string} userId
 * @returns List of Group Informations
 */
export const getGroupList = async (userId: string) => {
  return groupService.getGroupList(userId);
};
