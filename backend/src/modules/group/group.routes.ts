import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  webhookController,
  topupController,
  withdrawController,
  getGroupTransactionHistoryController,
  createGroupController,
  leaveGroupController,
  inviteGroupMemberController,
  removeGroupMemberController,
  processInvitationController,
  getGroupListController,
  getInvitationListController,
  getPendingInvitationController,
  getMemberListController,
  getGroupController,
  findInviteeController,
} from "./group.controller";

// A single router for the group module — money endpoints plus group
// management/CRUD/invitation endpoints.
export const groupRouter = Router();

groupRouter.post("/webhook", asyncHandler(webhookController));
groupRouter.post("/topup", asyncHandler(topupController));
groupRouter.post("/withdraw", asyncHandler(withdrawController));
groupRouter.get(
  "/group/transaction/history",
  asyncHandler(getGroupTransactionHistoryController)
);

// --- Group management / invitations ---
// NOTE: specific `/groups/...` routes must be registered before the greedy
// `/groups/:groupId` route below, or it will shadow them.
groupRouter.post("/groups/create", asyncHandler(createGroupController));
groupRouter.put("/groups/leave", asyncHandler(leaveGroupController));
groupRouter.put(
  "/groups/invite/:groupId/:targetId/:creatorId",
  asyncHandler(inviteGroupMemberController)
);
groupRouter.put(
  "/groups/remove/:groupId/:targetId/:creatorId",
  asyncHandler(removeGroupMemberController)
);
groupRouter.put(
  "/invitation/process/:invitationId/:mode",
  asyncHandler(processInvitationController)
);
groupRouter.get("/groups/batch", asyncHandler(getGroupListController));
groupRouter.get("/invitation/batch", asyncHandler(getInvitationListController));
groupRouter.get(
  "/groups/invitation/pending",
  asyncHandler(getPendingInvitationController)
);
groupRouter.get("/groups/member", asyncHandler(getMemberListController));
groupRouter.get("/groups/:groupId", asyncHandler(getGroupController));
groupRouter.get(
  "/find/invitee/:email/:userId/:groupId",
  asyncHandler(findInviteeController)
);
