import { groupService } from "../../modules/group/group.container";

/**
 * <Get Invitation that is received by user>
 *
 * @param {string} userId
 * @returns List of Invitation
 */
export const getInvitationList = async (userId: string) => {
  return groupService.getInvitationList(userId);
};
