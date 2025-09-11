/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { adminBlockId } from "../../src/admin/adminBlockId";
import User from "../../model/User";
import HTTPError from "http-errors";
import { Types } from "mongoose";

vi.mock("../../model/User");

type SaveFn = () => Promise<unknown>;
interface MockUserDoc {
  _id: string | InstanceType<typeof Types.ObjectId>;
  isLocked: boolean;
  save: SaveFn;
}

describe("adminBlockId", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets isLocked=true and saves the user", async () => {
    const mockUser: MockUserDoc = {
      _id: new Types.ObjectId(userId),
      isLocked: false,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    const result = await adminBlockId(userId, true);

    // findById called with ObjectId equivalent to the string
    const arg = vi.mocked(User.findById).mock.calls[0][0];
    expect(String(arg)).toBe(userId);

    expect(mockUser.isLocked).toBe(true);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockUser); // returns the same updated doc
  });

  it("sets isLocked=false and saves the user", async () => {
    const mockUser: MockUserDoc = {
      _id: new Types.ObjectId(userId),
      isLocked: true,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    const result = await adminBlockId(userId, false);

    const arg = vi.mocked(User.findById).mock.calls[0][0];
    expect(String(arg)).toBe(userId);

    expect(mockUser.isLocked).toBe(false);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockUser);
  });

  it("throws HTTPError(404) when the user is not found", async () => {
    vi.mocked(User.findById).mockResolvedValueOnce(null as any);

    await expect(adminBlockId(userId, true)).rejects.toThrow("User not found");

    await adminBlockId(userId, true).catch((err: unknown) => {
      const e = err as ReturnType<typeof HTTPError>;
      expect((e as any).status || (e as any).statusCode).toBe(404);
    });

    const arg = vi.mocked(User.findById).mock.calls[0][0];
    expect(String(arg)).toBe(userId);
  });
});
