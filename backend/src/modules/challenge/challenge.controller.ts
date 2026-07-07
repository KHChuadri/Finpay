import { Request, Response } from "express";
import { challengeService } from "./challenge.container";

export const getChallengesController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  const response = await challengeService.getChallenges(userId, page, limit);

  if (response.success) {
    res.status(200).json(response);
  }
};

export const checkBalanceChallengesController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      errorMsg: "userId is required",
    });
    return;
  }

  const result = await challengeService.checkBalanceChallenges(userId);
  res.status(200).json(result);
};
