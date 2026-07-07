import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  checkBalanceChallengesController,
  getChallengesController,
} from "./challenge.controller";

export const challengeRouter = Router();

challengeRouter.get(
  "/view/challenges/:userId",
  asyncHandler(getChallengesController)
);
challengeRouter.post(
  "/user/checkBalanceChallenges",
  asyncHandler(checkBalanceChallengesController)
);
