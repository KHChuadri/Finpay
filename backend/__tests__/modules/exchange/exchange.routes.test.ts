import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { exchangeRouter } from "../../../src/modules/exchange/exchange.routes";

const makeApp = () => {
  const app = express();
  app.use(exchangeRouter);
  return app;
};

describe("GET /exchangerate/:currencySource/:currencyDest", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          rates: { AUD: 1.5, USD: 1, EUR: 0.9 },
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the computed rate", async () => {
    const res = await request(makeApp()).get("/exchangerate/USD/AUD");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rate: 1.5 });
  });

  it("returns 404 when the source currency is unsupported", async () => {
    const res = await request(makeApp()).get("/exchangerate/XYZ/AUD");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      errorMsg: "Currency exchange from XYZ is not yet supported",
    });
  });

  it("returns 404 when the destination currency is unsupported", async () => {
    const res = await request(makeApp()).get("/exchangerate/USD/XYZ");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      errorMsg: "Currency exchange to XYZ is not yet supported",
    });
  });
});
