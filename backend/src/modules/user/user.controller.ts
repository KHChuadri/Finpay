import { Request, Response } from "express";
import { userService } from "./user.container";

export const getUserRankController = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  const response = await userService.getUserRank(userId);
  res.status(200).json(response);
};

export const getUserIsAdminController = async (
  req: Request,
  res: Response
) => {
  const userId = req.params.userId;

  const response = await userService.getUserIsAdmin(userId);
  res.status(200).json(response);
};

export const getUserTransactionHistoryController = async (
  req: Request,
  res: Response
) => {
  const userId = req.query.userId as string;

  const response = await userService.getUserTransactionHistory(userId);
  res.json(response);
};
