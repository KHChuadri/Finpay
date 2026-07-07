import { groupService } from "../modules/group/group.container";

/**
 * <Get Member Of A Group>
 *
 * @param {string} groupId
 * @returns List of Member (User) type
 */
export const getMemberList = async (groupId: string) => {
  return groupService.getMemberList(groupId);
};
