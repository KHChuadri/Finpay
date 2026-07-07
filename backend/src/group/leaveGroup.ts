import { groupService } from "../modules/group/group.container";

/**
 * <Handle User Leaving Group>
 *
 * @param {string} groupId
 * @param {string} actor
 * @returns { message: string } object with "Successfully Left Group" message
 */
export const leaveGroup = async (groupId: string, actor: string) => {
  return groupService.leaveGroup(groupId, actor);
};
