import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import HTTPError from "http-errors";
import { randomUUID } from "crypto";
import type {
  AdminLoginResult,
  AuthServiceDeps,
  LoginResult,
  RegisterResult,
} from "./auth.types";

export const createAuthService = (deps: AuthServiceDeps) => {
  const { repo } = deps;

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<RegisterResult> => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await repo.findUserByEmail(email);
    if (existingUser) {
      throw HTTPError(400, "Corresponding email has been used.");
    }

    let depositId: string = randomUUID();
    while (await repo.depositIdExists(depositId)) {
      depositId = randomUUID();
    }

    const secret = process.env.JWT_SECRET!;
    const signToken = (userId: unknown, userEmail: string) =>
      jwt.sign({ userId, email: userEmail }, secret);

    return repo.createUserWithWallet(
      {
        firstName,
        lastName,
        email,
        hashedPassword,
        passwordLength: password.length,
        depositId,
      },
      signToken
    );
  };

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    if (
      !email ||
      !password ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      throw HTTPError(400, "Email and password are required");
    }

    const targetUser = await repo.findUserByEmail(email);
    if (!targetUser) {
      throw HTTPError(404, "Account does not exist with the given email");
    }

    const matchedPassword = await bcrypt.compare(
      password,
      targetUser.password
    );
    if (!matchedPassword) {
      throw HTTPError(400, "Incorrect password");
    }

    return { userId: targetUser.id };
  };

  const logout = async (token: string, userId: string) => {
    const found = await repo.removeToken(userId, token);
    if (!found) {
      throw HTTPError(400, "User not found or does not exist");
    }

    return {};
  };

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<AdminLoginResult> => {
    if (
      !email ||
      !password ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      throw HTTPError(400, "Email and password are required");
    }

    const candidate = await repo.findAdminCandidate(email);
    if (!candidate) {
      throw HTTPError(404, "Account does not exist with the given email");
    }

    const matchedPassword = await bcrypt.compare(password, candidate.password);
    if (!matchedPassword) {
      throw HTTPError(400, "Incorrect password");
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ email: candidate.email }, secret);

    await repo.appendToken(candidate, token);

    if (!candidate.isAdmin) {
      throw HTTPError(400, `User is not an admin`);
    }

    return { token, userId: candidate.id };
  };

  return { register, login, logout, adminLogin };
};
