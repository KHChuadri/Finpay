import { Request, Response } from "express";
import { adminService } from "./admin.container";

export const adminGetUserController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);
  const response = await adminService.getUsers(page, limit);
  res.json(response);
};

export const adminGetRequestController = async (
  req: Request,
  res: Response
) => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);
  const response = await adminService.getRequests(page, limit);
  res.json(response);
};

export const adminVerifyController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const verify = req.body.isVerified;
  const response = await adminService.verifyUser(userId, verify);
  res.json(response);
};

export const adminBlockController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const block = req.body.isLocked;
  const response = await adminService.blockUser(userId, block);
  res.json(response);
};

export const adminCreateChallengeController = async (
  req: Request,
  res: Response
) => {
  const {
    category,
    title,
    description,
    startDate,
    endDate,
    exp,
    amountToGoal,
  } = req.body;

  const response = await adminService.createChallenge({
    category,
    title,
    description,
    startDate,
    endDate,
    exp,
    amountToGoal,
  });
  res.status(200).json(response);
};

export const adminCheckAllBalanceChallengesController = async (
  req: Request,
  res: Response
) => {
  const response = await adminService.checkAllBalanceChallenges();
  res.status(200).json(response);
};
