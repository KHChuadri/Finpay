import { describe, it, expect, vi } from "vitest";
import { createAdminService } from "../../../src/modules/admin/admin.service";
import type { IAdminRepository } from "../../../src/modules/admin/admin.types";

const makeRepo = (
  over: Partial<IAdminRepository> = {}
): IAdminRepository => ({
  findUsersPage: vi.fn(async () => []),
  countUsers: vi.fn(async () => 0),
  findWithdrawRequestsPage: vi.fn(async () => []),
  findUserById: vi.fn(async () => null),
  createChallenge: vi.fn(async () => ({})),
  findActiveUserIds: vi.fn(async () => []),
  ...over,
});

describe("admin.service.checkAllBalanceChallenges", () => {
  it("reproduces the legacy {success, totalUsers, results} shape, calling the delegate per active user", async () => {
    const repo = makeRepo({
      findActiveUserIds: vi.fn(async () => ["u1", "u2"]),
    });
    const checkBalanceChallenges = vi.fn(async (userId: string) => {
      if (userId === "u1") {
        return { success: true, updated: 1, completedChallenges: ["c1"] };
      }
      throw new Error("boom");
    });

    const service = createAdminService({ repo, checkBalanceChallenges });
    const result = await service.checkAllBalanceChallenges();

    expect(checkBalanceChallenges).toHaveBeenCalledTimes(2);
    expect(checkBalanceChallenges).toHaveBeenNthCalledWith(1, "u1");
    expect(checkBalanceChallenges).toHaveBeenNthCalledWith(2, "u2");

    expect(result).toEqual({
      success: true,
      totalUsers: 2,
      results: [
        { userId: "u1", success: true, updated: 1, completedChallenges: ["c1"] },
        { userId: "u2", success: false, error: new Error("boom") },
      ],
    });
  });

  it("returns an empty results array with totalUsers 0 when there are no active users", async () => {
    const repo = makeRepo({ findActiveUserIds: vi.fn(async () => []) });
    const checkBalanceChallenges = vi.fn(async () => ({}));

    const service = createAdminService({ repo, checkBalanceChallenges });
    const result = await service.checkAllBalanceChallenges();

    expect(checkBalanceChallenges).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, totalUsers: 0, results: [] });
  });
});
