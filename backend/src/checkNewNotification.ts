import { notificationService } from "./modules/notification/notification.container";

/**
 * <Check if user has new notification>
 *
 * @param {string} userId
 * @returns boolean if user has new notif
 */
export const checkNewNotification = async (userId: string) => {
  return notificationService.hasNewNotification(userId);
};
