import { Request, Response, NextFunction, RequestHandler } from "express";
import { handleHTTPError } from "../../helper/handleHTTPError";

/**
 * Wraps an async route handler so thrown errors are funneled through
 * the shared HTTP error translator instead of being repeated per-route.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  };
