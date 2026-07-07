import { groupService } from "../modules/group/group.container";

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
  return groupService.editGroupMember(groupId, target, mode, actor);
};
