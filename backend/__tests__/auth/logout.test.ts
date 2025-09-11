/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { logout } from "../../src/auth/logout";
import User from "../../model/User";
import HTTPError from "http-errors";

vi.mock("../../model/User");

describe("logout()", () => {
  const userId = "507f1f77bcf86cd799439011";
  const tokenA = "token.A";
  const tokenB = "token.B";
  const tokenC = "token.C";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes the given token from the user's tokens and saves", async () => {
    const mockUser = {
      _id: userId,
      tokens: [tokenA, tokenB, tokenC],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    const result = await logout(tokenB, userId);

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.tokens).toEqual([tokenA, tokenC]);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({});
  });

  it("throws HTTPError(400) if the user does not exist", async () => {
    vi.mocked(User.findById).mockResolvedValueOnce(null as any);

    await expect(logout(tokenA, userId)).rejects.toThrow(
      "User not found or does not exist"
    );

    await logout(tokenA, userId).catch((err: unknown) => {
      const e = err as ReturnType<typeof HTTPError>;
      expect(e).toBeInstanceOf(Error);
      expect((e as any).status || (e as any).statusCode).toBe(400);
    });

    expect(User.findById).toHaveBeenCalledWith(userId);
  });

  it("removes only the matching token when multiple tokens exist", async () => {
    const mockUser = {
      _id: userId,
      tokens: [tokenA, tokenB, tokenC, tokenB],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    await logout(tokenB, userId);

    expect(mockUser.tokens).toEqual([tokenA, tokenC, tokenB]);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });

  it("does not remove any token when the token is not present (EXPECTED behavior)", async () => {
    const mockUser = {
      _id: userId,
      tokens: [tokenA, tokenB],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    await logout("non-existent-token", userId);

    expect(mockUser.tokens).toEqual([tokenA, tokenB]);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });
});
