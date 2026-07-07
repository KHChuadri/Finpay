import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import type {
  AdminLoginCandidate,
  AuthUserRecord,
  IAuthRepository,
  RegisterInput,
  RegisterResult,
} from "./auth.types";

const toAuthUserRecord = (doc: {
  _id: unknown;
  email: string;
  password: string;
  isAdmin: boolean;
}): AuthUserRecord => ({
  id: String(doc._id),
  email: doc.email,
  password: doc.password,
  isAdmin: doc.isAdmin,
});

export const authRepository: IAuthRepository = {
  async findUserByEmail(email) {
    const doc = await User.findOne({ email });
    return doc ? toAuthUserRecord(doc) : null;
  },

  async depositIdExists(depositId) {
    const doc = await User.findOne({ depositId });
    return doc != null;
  },

  async createUserWithWallet(
    input: RegisterInput,
    signToken: (userId: unknown, email: string) => string
  ): Promise<RegisterResult> {
    const newUser = new User({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.hashedPassword,
      passwordLength: input.passwordLength,
      walletInfo: [],
      tokens: [],
      depositId: input.depositId,
    });
    await newUser.save();

    const newWalletInfo = new WalletInfo({
      walletCurrency: "AUD",
      walletBalance: 100,
      userId: newUser._id,
    });
    await newWalletInfo.save();

    newUser.walletInfo.push(newWalletInfo._id);
    await newUser.save();

    const token = signToken(newUser._id, newUser.email);

    newUser.tokens.push(token);
    await newUser.save();

    return {
      token,
      userId: newUser._id.toString(),
    };
  },

  async removeToken(userId, token) {
    const doc = await User.findById(userId);
    if (!doc) {
      return false;
    }

    const index = doc.tokens.findIndex((t) => t === token);
    if (index !== -1) {
      doc.tokens.splice(index, 1);
    }
    await doc.save();

    return true;
  },

  async findAdminCandidate(email): Promise<AdminLoginCandidate | null> {
    const doc = await User.findOne({ email });
    if (!doc) {
      return null;
    }

    return {
      id: String(doc._id),
      email: doc.email,
      password: doc.password,
      isAdmin: doc.isAdmin,
      ref: doc,
    };
  },

  async appendToken(candidate, token) {
    const doc = candidate.ref as { tokens: string[]; save: () => Promise<unknown> };
    doc.tokens.push(token);
    await doc.save();
  },
};
