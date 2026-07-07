import { Request, Response } from "express";
import { groupService } from "./group.container";

export const webhookController = async (req: Request, res: Response) => {
  const depositData = req.body;
  const response = await groupService.setDepositData(depositData);
  res.status(201).json(response);
};

export const topupController = async (req: Request, res: Response) => {
  const {
    debtorAccountWallet,
    groupId,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const response = await groupService.topup({
    debtorWalletId: debtorAccountWallet,
    groupId,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(response);
};

export const withdrawController = async (req: Request, res: Response) => {
  const {
    creditorInfo,
    groupId,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const response = await groupService.withdraw({
    creditorInfo,
    groupId,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(response);
};

export const getGroupTransactionHistoryController = async (
  req: Request,
  res: Response
) => {
  const groupId = req.query.groupId as string;
  const response = await groupService.getGroupTransactionHistory(groupId);
  res.json(response);
};

// --- Group management / invitations ---

export const createGroupController = async (req: Request, res: Response) => {
  const { groupName, description, userId, currency } = req.body;
  const response = await groupService.createGroup({
    groupName,
    description,
    creatorId: userId,
    currency,
  });
  res.json(response);
};

export const leaveGroupController = async (req: Request, res: Response) => {
  const { groupId, userId } = req.query as {
    groupId: string;
    userId: string;
  };
  const response = await groupService.leaveGroup(groupId, userId);
  res.json(response);
};

export const inviteGroupMemberController = async (
  req: Request,
  res: Response
) => {
  const { groupId, targetId, creatorId } = req.params;
  const response = await groupService.editGroupMember(
    groupId,
    targetId,
    "add",
    creatorId
  );
  res.json(response);
};

export const removeGroupMemberController = async (
  req: Request,
  res: Response
) => {
  const { groupId, targetId, creatorId } = req.params;
  const response = await groupService.editGroupMember(
    groupId,
    targetId,
    "remove",
    creatorId
  );
  res.json(response);
};

export const processInvitationController = async (
  req: Request,
  res: Response
) => {
  const { invitationId, mode } = req.params;
  const response = await groupService.processInvitation(invitationId, mode);
  res.json(response);
};

export const getGroupListController = async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const response = await groupService.getGroupList(userId);
  res.json(response);
};

export const getInvitationListController = async (
  req: Request,
  res: Response
) => {
  const userId = req.query.userId as string;
  const response = await groupService.getInvitationList(userId);
  res.json(response);
};

export const getPendingInvitationController = async (
  req: Request,
  res: Response
) => {
  const groupId = req.query.groupId as string;
  const response = await groupService.getPendingInvitation(groupId);
  res.json(response);
};

export const getMemberListController = async (
  req: Request,
  res: Response
) => {
  const groupId = req.query.groupId as string;
  const response = await groupService.getMemberList(groupId);
  res.json(response);
};

export const getGroupController = async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const response = await groupService.getGroup(groupId);
  res.json(response);
};

export const findInviteeController = async (req: Request, res: Response) => {
  const { email, userId, groupId } = req.params;
  const response = await groupService.findInvitee(email, userId, groupId);
  res.status(200).json(response);
};
