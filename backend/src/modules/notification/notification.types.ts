import type { NotificationType } from "../../../model/Notification";

export interface UserNotificationInfo {
  id: string;
  /** `null` mirrors the legacy `!Array.isArray(findUser.notification)` guard. */
  notificationIds: string[] | null;
  lastNotificationSeen: Date;
}

export interface INotificationRepository {
  findUserNotificationInfo(
    userId: string
  ): Promise<UserNotificationInfo | null>;
  hasNewNotification(
    notificationIds: string[],
    since: Date
  ): Promise<boolean>;
  /** Returns raw notification docs (incl. `_id`, timestamps, `__v`) — matches legacy serialization. */
  findNotificationsByIds(
    notificationIds: string[]
  ): Promise<NotificationType[]>;
  markNotificationsSeen(userId: string): Promise<void>;
}

export interface NotificationServiceDeps {
  repo: INotificationRepository;
}
