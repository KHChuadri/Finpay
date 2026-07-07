import { groupService } from "../modules/group/group.container";

/**
 * <find the target invitee from email>
 *
 * @param {string} email
 * @param {string} userId
 * @param {string} groupId
 * @returns recepient userId
 */
export const findInvitee = async (
  email: string,
  userId: string,
  groupId: string
) => {
  return groupService.findInvitee(email, userId, groupId);
};
