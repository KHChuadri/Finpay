export interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  passwordLength: number;
  depositId: string;
}

export interface RegisterResult {
  token: string;
  userId: string;
}

export interface LoginResult {
  userId: string;
}

export interface AdminLoginResult {
  token: string;
  userId: string;
}

/**
 * Opaque handle back to the live Mongoose document found for an admin-login
 * candidate. Only `appendToken` (repository) dereferences `ref`; the service
 * treats it as a capability it forwards, never inspects.
 */
export interface AdminLoginCandidate {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
  ref: unknown;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  depositIdExists(depositId: string): Promise<boolean>;
  /**
   * Creates the user + starter AUD wallet and appends the auth token, mirroring
   * the legacy 3-save sequence exactly. `signToken` is invoked once the new
   * user id/email are known, right before the token is persisted; the actual
   * `jwt.sign` call site lives in the service.
   */
  createUserWithWallet(
    input: RegisterInput,
    signToken: (userId: unknown, email: string) => string
  ): Promise<RegisterResult>;
  /** Removes `token` from the user's tokens (if present) and always saves. Returns false if the user doesn't exist. */
  removeToken(userId: string, token: string): Promise<boolean>;
  findAdminCandidate(email: string): Promise<AdminLoginCandidate | null>;
  appendToken(candidate: AdminLoginCandidate, token: string): Promise<void>;
}

export interface AuthServiceDeps {
  repo: IAuthRepository;
}
