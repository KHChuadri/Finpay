/** Legacy hand-flattened response shape returned by `getProfile`. */
export interface ProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  passwordLength: number;
  dob: Date | null;
  address: {
    addressLine1: string | null;
    addressLine2: string | null;
    country: string | null;
  };
  isVerified: boolean;
  isLocked: boolean;
  KYCimg: string | null;
  profileImg: string | null;
  groups: string[];
  rank: string | null;
  exp: number | null;
  depositId: string;
  accountType: string;
}

/** Minimal structural shape of a Multer file — avoids importing Express types here. */
export interface MulterFileLike {
  buffer: Buffer;
}

export interface EditProfilePayload {
  firstName?: string;
  lastName?: string;
  dob?: string | Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
  profileImg?: string | MulterFileLike | null;
  accountType?: string | null;
}

export interface EditProfileResult {
  message: string;
}

export interface UploadKycResult {
  success: true;
  imageUrl: string;
}

export interface ProfileUserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordLength: number | null;
  isVerified: boolean;
  isLocked: boolean;
  KYCimg: string | null;
  profileImg: string | null;
  groups: string[];
  rank: string | null;
  exp: number | null;
  depositId: string;
  accountType: string;
  bioDataId: string | null;
}

export interface ProfileBioDataRecord {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  addressId: string | null;
}

export interface ProfileAddressRecord {
  id: string;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
}

export interface AddressPatch {
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
}

export interface BioDataPatch {
  firstName?: string;
  lastName?: string;
  /** Presence of the key matters: unset via `undefined` mirrors legacy `bioData.dateOfBirth = undefined`. */
  dateOfBirth?: Date;
  addressId: string;
}

export interface UserProfilePatch {
  firstName?: string;
  lastName?: string;
  accountType?: "personal" | "business";
  profileImg?: string;
  bioDataId: string;
}

export interface IProfileRepository {
  findUserById(userId: string): Promise<ProfileUserRecord | null>;
  findBioDataById(id: string): Promise<ProfileBioDataRecord | null>;
  findAddressById(id: string): Promise<ProfileAddressRecord | null>;
  /** Finds by `id` (if provided) else creates a new address for `userId`, applies `patch`, saves. */
  upsertAddress(
    id: string | null,
    userId: string,
    patch: AddressPatch
  ): Promise<{ id: string }>;
  /** Finds by `id` (if provided) else creates new bio data for `userId`, applies `patch`, saves. */
  upsertBioData(
    id: string | null,
    userId: string,
    patch: BioDataPatch
  ): Promise<{ id: string }>;
  updateUser(userId: string, patch: UserProfilePatch): Promise<void>;
  setUserKycImage(userId: string, imageUrl: string): Promise<void>;
}

export interface ProfileServiceDeps {
  repo: IProfileRepository;
  /** Uploads `buffer` to the given folder and resolves with the resulting secure URL. */
  uploadImage: (buffer: Buffer, folder: string) => Promise<string>;
}
