import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { notificationRouter } from "../../../src/modules/notification/notification.routes";
import { createTestUser } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import Notification from "../../../model/Notification";
import User from "../../../model/User";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(notificationRouter);
  return app;
};

describe("Notification routes", () => {
  let user: UserType;
  let sender: UserType;
  const lastNotificationSeen = new Date("2024-01-01T00:00:00.000Z");

  beforeEach(async () => {
    sender = await createTestUser({ email: "sender@test.com" });
    user = await createTestUser({
      email: "notification-routes@test.com",
      lastNotificationSeen,
    });
  });

  describe("GET /notification/new/:userId", () => {
    it("returns false when there is no notification newer than lastNotificationSeen", async () => {
      const notification = await Notification.create({
        type: "Mission",
        description: "old",
        sender: sender._id,
        receiver: user._id,
        createdAt: new Date("2023-12-01T00:00:00.000Z"),
      });
      await User.findByIdAndUpdate(user._id, {
        $push: { notification: notification._id },
      });

      const res = await request(makeApp()).get(
        `/notification/new/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toBe(false);
    });

    it("returns true when a notification is newer than lastNotificationSeen", async () => {
      const notification = await Notification.create({
        type: "Mission",
        description: "fresh",
        sender: sender._id,
        receiver: user._id,
        createdAt: new Date("2024-06-01T00:00:00.000Z"),
      });
      await User.findByIdAndUpdate(user._id, {
        $push: { notification: notification._id },
      });

      const res = await request(makeApp()).get(
        `/notification/new/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toBe(true);
    });

    it("returns 400 when the user does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp()).get(
        `/notification/new/${missingId}`
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "User not found or does not exist",
      });
    });
  });

  describe("GET /notification/:userId", () => {
    it("returns the raw, populated notification docs owned by the user", async () => {
      const notification = await Notification.create({
        type: "Transfer",
        description: "you got paid",
        sender: sender._id,
        receiver: user._id,
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
      });
      await User.findByIdAndUpdate(user._id, {
        $push: { notification: notification._id },
      });

      const res = await request(makeApp()).get(
        `/notification/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      const [returned] = res.body;
      // Locks the raw-doc shape: `_id`, not a flattened `id`.
      expect(returned._id).toBe(notification._id.toString());
      expect(returned.id).toBeUndefined();
      expect(returned.type).toBe("Transfer");
      expect(returned.description).toBe("you got paid");
      // populate() resolves sender/receiver into full sub-documents.
      expect(returned.sender._id).toBe(sender._id.toString());
      expect(returned.receiver._id).toBe(user._id.toString());
    });

    it("returns 400 when the user does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp()).get(`/notification/${missingId}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "User not found or does not exist",
      });
    });
  });

  describe("route ordering", () => {
    it("does not let /notification/:userId shadow /notification/new/:userId", async () => {
      const res = await request(makeApp()).get(
        `/notification/new/${user._id.toString()}`
      );

      // If the generic `:userId` route matched first, `"new"` would be cast
      // as an ObjectId for /notification/:userId and blow up with a 500.
      expect(res.status).toBe(200);
      expect(typeof res.body).toBe("boolean");
    });
  });
});
