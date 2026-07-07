import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { Writable } from "stream";
import { profileRouter } from "../../../src/modules/profile/profile.routes";
import { createTestUser } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import User from "../../../model/User";
import BioData from "../../../model/BioData";
import Address from "../../../model/Address";

const MOCK_SECURE_URL = "https://cloudinary.test/mock-kyc-image.jpg";

vi.mock("../../../lib/cloudinaryClient", () => ({
  default: {
    uploader: {
      upload_stream: (
        _options: unknown,
        callback: (error: unknown, result?: { secure_url: string }) => void
      ) => {
        const stream = new Writable({
          write(_chunk, _enc, cb) {
            cb();
          },
        });
        stream.on("finish", () => {
          callback(null, { secure_url: MOCK_SECURE_URL });
        });
        return stream;
      },
    },
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(profileRouter);
  return app;
};

describe("Profile routes", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ email: "profile-routes@test.com" });
  });

  describe("GET /user/profile/:userId", () => {
    it("returns the hand-flattened profile shape", async () => {
      const address = await Address.create({
        userId: user._id,
        addressLine1: "1 Main St",
        addressLine2: "Unit 2",
        country: "Australia",
      });
      const dob = new Date("1990-01-01");
      const bioData = await BioData.create({
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: dob,
        address: address._id,
      });
      await User.findByIdAndUpdate(user._id, { bioData: bioData._id });

      const res = await request(makeApp()).get(
        `/user/profile/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordLength: user.passwordLength,
        dob: dob.toISOString(),
        address: {
          addressLine1: "1 Main St",
          addressLine2: "Unit 2",
          country: "Australia",
        },
        isVerified: user.isVerified,
        isLocked: user.isLocked,
        KYCimg: null,
        profileImg: null,
        groups: [],
        rank: user.rank,
        exp: user.exp,
        depositId: user.depositId,
        accountType: user.accountType,
      });
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp()).get(`/user/profile/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "User not found" });
    });
  });

  describe("PUT /user/profile/:userId", () => {
    it("updates a string field with no file", async () => {
      // BioData requires firstName/lastName; the test user's default `bioData`
      // ref doesn't point at a real doc, so a new one gets created on save
      // (mirrors legacy behavior) - send both fields to satisfy that.
      const res = await request(makeApp())
        .put(`/user/profile/${user._id.toString()}`)
        .send({ firstName: "Updated", lastName: "Name" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Profile updated" });

      const updated = await User.findById(user._id);
      expect(updated?.firstName).toBe("Updated");
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp())
        .put(`/user/profile/${missingId}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "User not found" });
    });
  });

  describe("PUT /user/profile/upload-kyc", () => {
    it("uploads the KYC image and stores its URL", async () => {
      const res = await request(makeApp())
        .put("/user/profile/upload-kyc")
        .field("userId", user._id.toString())
        .attach("kycImage", Buffer.from("fake-image-bytes"), "kyc.jpg");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        imageUrl: MOCK_SECURE_URL,
      });

      const updated = await User.findById(user._id);
      expect(updated?.KYCimg).toBe(MOCK_SECURE_URL);
    });
  });
});
