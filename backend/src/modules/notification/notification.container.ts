// Composition root for the notification slice: wires the real repository once.
import { createNotificationService } from "./notification.service";
import { notificationRepository } from "./notification.repository";

export const notificationService = createNotificationService({
  repo: notificationRepository,
});
