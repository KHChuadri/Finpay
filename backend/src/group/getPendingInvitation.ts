import { groupService } from "../modules/group/group.container";

/**
 * <Get Group's Invitation List>
 *
 * @param {string} groupId
 * @returns Group Invitation List
 */
export const getPendingInvitation = async (groupId: string) => {
  return groupService.getPendingInvitation(groupId);
};
