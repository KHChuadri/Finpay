import HTTPError from "http-errors";
import type { NotificationServiceDeps } from "./notification.types";

export const createNotificationService = (deps: NotificationServiceDeps) => {
  const { repo } = deps;

  /** Mirrors legacy checkNewNotification. */
  const hasNewNotification = async (userId: string) => {
    const user = await repo.findUserNotificationInfo(userId);
    if (!user) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (!Array.isArray(user.notificationIds)) {
      throw HTTPError(400, "User has no Notification");
    }

    return repo.hasNewNotification(
      user.notificationIds,
      user.lastNotificationSeen
    );
  };

  /** Mirrors legacy getNotification. */
  const getNotificationList = async (userId: string) => {
    const user = await repo.findUserNotificationInfo(userId);
    if (!user) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (!Array.isArray(user.notificationIds)) {
      throw HTTPError(400, "User has no Notification");
    }

    const notifications = await repo.findNotificationsByIds(
      user.notificationIds
    );
    await repo.markNotificationsSeen(userId);

    return notifications;
  };

  return {
    hasNewNotification,
    getNotificationList,
  };
};
