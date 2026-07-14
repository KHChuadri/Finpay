import { Request, Response } from "express";
import { authService } from "./auth.container";

export const registerController = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const response = await authService.register(
    firstName,
    lastName,
    email,
    password
  );
  res.status(201).json(response);
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = await authService.login(email, password);
  res.json(response);
};

export const adminLoginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = await authService.adminLogin(email, password);
  res.json(response);
};

export const logoutController = async (req: Request, res: Response) => {
  const { token, userId } = req.body;
  const response = await authService.logout(token, userId);
  res.json(response);
};
