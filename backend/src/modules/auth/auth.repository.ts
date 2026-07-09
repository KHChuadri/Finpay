import { getDb } from "../../../lib/db";
import { users, wallets } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import type {
  AdminLoginCandidate,
  AuthUserRecord,
  IAuthRepository,
  RegisterInput,
  RegisterResult,
} from "./auth.types";

const toAuthUserRecord = (r: {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
}): AuthUserRecord => ({
  id: r.id,
  email: r.email,
  password: r.password,
  isAdmin: r.isAdmin,
});

export const authRepository: IAuthRepository = {
  async findUserByEmail(email) {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email, password: users.password, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.email, email));
    return r ? toAuthUserRecord(r) : null;
  },

  async depositIdExists(depositId) {
    const [r] = await getDb().select({ id: users.id }).from(users).where(eq(users.depositId, depositId));
    return r != null;
  },

  async createUserWithWallet(
    input: RegisterInput,
    signToken: (userId: unknown, email: string) => string
  ): Promise<RegisterResult> {
    const [newUser] = await getDb()
      .insert(users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: input.hashedPassword,
        passwordLength: input.passwordLength,
        depositId: input.depositId,
      })
      .returning({ id: users.id, email: users.email });

    await getDb()
      .insert(wallets)
      .values({ walletCurrency: "AUD", walletBalance: "100", userId: newUser.id });

    const token = signToken(newUser.id, newUser.email);

    await getDb()
      .update(users)
      .set({ tokens: sql`array_append(${users.tokens}, ${token})` })
      .where(eq(users.id, newUser.id));

    return { token, userId: newUser.id };
  },

  async removeToken(userId, token) {
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId));
    if (!u) return false;
    await getDb()
      .update(users)
      .set({ tokens: sql`array_remove(${users.tokens}, ${token})` })
      .where(eq(users.id, userId));
    return true;
  },

  async findAdminCandidate(email): Promise<AdminLoginCandidate | null> {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email, password: users.password, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.email, email));
    if (!r) return null;
    return { id: r.id, email: r.email, password: r.password, isAdmin: r.isAdmin, ref: r.id };
  },

  async appendToken(candidate, token) {
    await getDb()
      .update(users)
      .set({ tokens: sql`array_append(${users.tokens}, ${token})` })
      .where(eq(users.id, candidate.ref as string));
  },
};
