import createHttpError from "http-errors";
import { Response } from "express";

/**
 * <Handle HTTPError from other functions>
 * 
 * @param {unknown} err 
 * @param {Response} res 
 */
export const handleHTTPError = (err: unknown, res: Response) => {
  if (createHttpError.isHttpError(err)) {
    res.status(err.status).json({ errorMsg: err.message });
  } else {
    res.status(500).json({ errorMsg: "Unexpected error" });
  }
}