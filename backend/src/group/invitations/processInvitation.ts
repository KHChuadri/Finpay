import { groupService } from "../../modules/group/group.container";

/**
 * <Process Invitation by either rejecting or accepting>
 *
 * @param {string} invitationId
 * @param {string} mode
 * @returns { message: string } object containing message: "Invitation Processed"
 */
export const processInvitation = async (invitationId: string, mode: string) => {
  return groupService.processInvitation(invitationId, mode);
};
