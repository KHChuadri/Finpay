import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { challengeRouter } from "../../../src/modules/challenge/challenge.routes";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import Challenge from "../../../model/Challenge";
import User from "../../../model/User";

vi.mock("../../../src/modules/exchange/exchange.container", () => ({
  exchangeService: {
    getRate: vi.fn().mockResolvedValue({ rate: 1 }),
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(challengeRouter);
  return app;
};

const activeWindow = () => {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

describe("GET /view/challenges/:userId", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser();
  });

  it("returns the paginated challenge list with the actual legacy shape", async () => {
    const { startDate, endDate } = activeWindow();
    const challenge = await Challenge.create({
      category: "pay",
      title: "Pay Challenge",
      description: "Pay someone",
      startDate,
      endDate,
      exp: 50,
      amountToGoal: 100,
    });

    const res = await request(makeApp())
      .get(`/view/challenges/${user._id.toString()}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPayments).toBe(1);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.challenge).toHaveLength(1);

    const item = res.body.challenge[0];
    expect(item._id).toBe(challenge._id.toString());
    expect(item).toMatchObject({
      title: "Pay Challenge",
      description: "Pay someone",
      exp: 50,
      category: "pay",
      progress: 0,
      amountToGoal: 100,
    });
    // No progress recorded yet for this user, so the legacy handler omits
    // the field entirely (JSON drops `undefined` values).
    expect(item).not.toHaveProperty("userProgress");
  });

  it("returns 404 when the user does not exist", async () => {
    const res = await request(makeApp())
      .get("/view/challenges/000000000000000000000000")
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "getChallenges: User not found" });
  });
});

describe("POST /user/checkBalanceChallenges", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ rank: "bronze", exp: 0 });
  });

  it("completes a save challenge and bumps exp + rank", async () => {
    // Legacy checkBalanceChallenges only sums non-AUD wallets (a pre-existing
    // quirk being preserved), so seed a non-AUD wallet.
    await createTestWallet(user._id.toString(), "USD", 1000);

    const { startDate, endDate } = activeWindow();
    const challenge = await Challenge.create({
      category: "save",
      title: "Save $500",
      description: "Save at least $500",
      startDate,
      endDate,
      exp: 250, // pushes exp from 0 -> 250, crossing the silver (200) threshold
      amountToGoal: 500,
    });

    const res = await request(makeApp())
      .post("/user/checkBalanceChallenges")
      .send({ userId: user._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      updated: 1,
      completedChallenges: [challenge._id.toString()],
    });

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.exp).toBe(250);
    expect(updatedUser?.rank).toBe("silver");
  });

  it("returns 400 when userId is missing", async () => {
    const res = await request(makeApp())
      .post("/user/checkBalanceChallenges")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      errorMsg: "userId is required",
    });
  });
});
