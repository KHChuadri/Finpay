import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  acceptRequestController,
  deleteRequestController,
  findRecipientController,
  getRequestListController,
  getSavedRecipientController,
  sendRequestController,
} from "./request.controller";

export const requestRouter = Router();

requestRouter.post(
  "/transaction/send-request",
  asyncHandler(sendRequestController)
);
requestRouter.get(
  "/transaction/request/:userId",
  asyncHandler(getRequestListController)
);
requestRouter.post(
  "/transaction/request/accept",
  asyncHandler(acceptRequestController)
);
requestRouter.delete(
  "/transaction/request/delete/:requestId",
  asyncHandler(deleteRequestController)
);
requestRouter.get(
  "/transaction/save-recipient/:userId",
  asyncHandler(getSavedRecipientController)
);
requestRouter.get(
  "/find/recipients/:email/:userId",
  asyncHandler(findRecipientController)
);
