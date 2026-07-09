import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  checkNewNotificationController,
  getNotificationController,
} from "./notification.controller";

export const notificationRouter = Router();

// `/notification/new/:userId` is more specific than `/notification/:userId`
// and must stay registered first so it isn't shadowed by the `:userId` route.
notificationRouter.get(
  "/notification/new/:userId",
  asyncHandler(checkNewNotificationController)
);
notificationRouter.get(
  "/notification/:userId",
  asyncHandler(getNotificationController)
);
