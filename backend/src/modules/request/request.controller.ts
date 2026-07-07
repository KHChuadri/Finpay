import { Request, Response } from "express";
import { requestService } from "./request.container";

export const sendRequestController = async (req: Request, res: Response) => {
  const { email, senderId, amount, currency, notes } = req.body;

  const response = await requestService.sendRequest(
    email,
    senderId,
    amount,
    currency,
    notes
  );

  res.json(response);
};

export const getRequestListController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;

  const response = await requestService.getRequestList(userId);
  res.status(200).json(response);
};

export const acceptRequestController = async (
  req: Request,
  res: Response
) => {
  const { requestId } = req.body;

  const response = await requestService.acceptRequest(requestId);
  res.json(response);
};

export const deleteRequestController = async (
  req: Request,
  res: Response
) => {
  const { requestId } = req.params;

  const response = await requestService.deleteRequest(requestId);
  res.json(response);
};

export const getSavedRecipientController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;

  const response = await requestService.getSavedRecipient(userId);
  res.status(200).json(response);
};

export const findRecipientController = async (
  req: Request,
  res: Response
) => {
  const { email, userId } = req.params;

  const response = await requestService.findRecipient(email, userId);
  res.status(200).json(response);
};
