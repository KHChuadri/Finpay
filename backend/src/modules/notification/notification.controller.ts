import { Request, Response } from "express";
import { notificationService } from "./notification.container";

export const checkNewNotificationController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;

  const response = await notificationService.hasNewNotification(userId);
  res.status(200).json(response);
};

export const getNotificationController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;

  const response = await notificationService.getNotificationList(userId);
  res.status(200).json(response);
};
