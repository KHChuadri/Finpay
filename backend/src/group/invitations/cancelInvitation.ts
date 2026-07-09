import HTTPError from "http-errors";
import { getDb } from "../../../lib/db";
import { groups, users, invitations } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * <Cancel Pending Invitation>
 *
 * @param {string} invitationId
 * @returns { message: string } object containing message stating "Invitation Cancelled"
 */
export const cancelInvitation = async (invitationId: string) => {
  const [invitation] = await getDb()
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId));
  if (!invitation) {
    throw HTTPError(404, "invitation not found");
  }
  const [group] = await getDb().select({ id: groups.id }).from(groups).where(eq(groups.id, invitation.groupId));
  const [member] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, invitation.receiver));

  if (!group) {
    throw HTTPError(404, "Group not found");
  }
  if (!member) {
    throw HTTPError(404, "User not found");
  }

  // Deleting the invitation row removes it from both derived views
  // (member.invitation via receiver, group.pendingInvite via groupId).
  await getDb().delete(invitations).where(eq(invitations.id, invitationId));

  return { message: "Invitation Cancelled" };
};
