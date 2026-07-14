import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import HTTPError from "http-errors";
import { asyncHandler } from "../../src/shared/http/asyncHandler";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("asyncHandler", () => {
  it("passes success through without touching the error handler", async () => {
    const res = mockRes();
    const handler = asyncHandler(async (_req, r) => {
      r.status(200).json({ ok: true });
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("translates a thrown HTTPError into status + errorMsg", async () => {
    const res = mockRes();
    const handler = asyncHandler(async () => {
      throw HTTPError(404, "nope");
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ errorMsg: "nope" });
  });

  it("translates an unknown error into 500", async () => {
    const res = mockRes();
    const handler = asyncHandler(async () => {
      throw new Error("boom");
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ errorMsg: "Unexpected error" });
  });
});
