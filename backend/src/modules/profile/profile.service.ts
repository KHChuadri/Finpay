import HTTPError from "http-errors";
import type {
  AddressPatch,
  BioDataPatch,
  EditProfilePayload,
  EditProfileResult,
  ProfileResponse,
  ProfileServiceDeps,
  UploadKycResult,
  UserProfilePatch,
} from "./profile.types";

export const createProfileService = (deps: ProfileServiceDeps) => {
  const { repo, uploadImage } = deps;

  /** Mirrors legacy getProfile: hand-flattened user + bioData + address. */
  const getProfile = async (userId: string): Promise<ProfileResponse> => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    let bioData = null;
    let address = null;

    if (user.bioDataId) {
      bioData = await repo.findBioDataById(user.bioDataId);

      if (bioData?.addressId) {
        address = await repo.findAddressById(bioData.addressId);
      }
    }

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordLength: user.passwordLength || 0,
      dob: bioData?.dateOfBirth || null,
      address: {
        addressLine1: address?.addressLine1 || null,
        addressLine2: address?.addressLine2 || null,
        country: address?.country || null,
      },
      isVerified: user.isVerified,
      isLocked: user.isLocked,
      KYCimg: user.KYCimg,
      profileImg: user.profileImg,
      groups: user.groups,
      rank: user.rank,
      exp: user.exp,
      depositId: user.depositId,
      accountType: user.accountType,
    };
  };

  /** Mirrors legacy editProfile: partial update of user/bioData/address. */
  const editProfile = async (
    userId: string,
    payload: EditProfilePayload
  ): Promise<EditProfileResult> => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    const {
      firstName,
      lastName,
      dob,
      addressLine1,
      addressLine2,
      country,
      profileImg,
      accountType,
    } = payload;

    const bioData = user.bioDataId
      ? await repo.findBioDataById(user.bioDataId)
      : null;
    const address = bioData?.addressId
      ? await repo.findAddressById(bioData.addressId)
      : null;

    // --- compute + validate patches before persisting anything ---

    const addressPatch: AddressPatch = {};
    if (addressLine1 !== undefined) addressPatch.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) addressPatch.addressLine2 = addressLine2;
    if (country !== undefined) addressPatch.country = country;

    let dobApplies = false;
    let dobValue: Date | undefined;

    const normalizedDob = dob === "" ? null : dob;
    if (normalizedDob !== undefined) {
      dobApplies = true;

      if (normalizedDob === null) {
        dobValue = undefined;
      } else {
        const date = new Date(normalizedDob);
        if (isNaN(date.getTime())) {
          throw HTTPError(400, "Invalid date format");
        }

        const today = new Date();
        if (date > today) {
          throw HTTPError(400, "Date of birth cannot be in the future");
        }
        dobValue = date;
      }
    }

    // --- validation passed; persist ---

    const { id: savedAddressId } = await repo.upsertAddress(
      address?.id ?? null,
      userId,
      addressPatch
    );

    const bioDataPatch: BioDataPatch = { addressId: savedAddressId };
    if (firstName !== undefined) bioDataPatch.firstName = firstName;
    if (lastName !== undefined) bioDataPatch.lastName = lastName;
    if (dobApplies) {
      bioDataPatch.dateOfBirth = dobValue;
    }

    const { id: savedBioDataId } = await repo.upsertBioData(
      bioData?.id ?? null,
      userId,
      bioDataPatch
    );

    const userPatch: UserProfilePatch = { bioDataId: savedBioDataId };
    if (firstName !== undefined) userPatch.firstName = firstName;
    if (lastName !== undefined) userPatch.lastName = lastName;
    if (accountType === "personal" || accountType === "business") {
      userPatch.accountType = accountType;
    }
    if (typeof profileImg === "string") {
      userPatch.profileImg = profileImg;
    }

    await repo.updateUser(userId, userPatch);

    return { message: "Profile updated" };
  };

  /** Mirrors legacy uploadKyc. */
  const uploadKyc = async (
    userId: string,
    kycImg?: { buffer: Buffer }
  ): Promise<UploadKycResult> => {
    if (!userId) {
      throw HTTPError(400, "Missing user ID");
    }
    if (!kycImg) {
      throw HTTPError(400, "Missing KYC image");
    }

    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    const imageUrl = await uploadImage(kycImg.buffer, "kyc_users");

    await repo.setUserKycImage(userId, imageUrl);

    return { success: true, imageUrl };
  };

  return {
    getProfile,
    editProfile,
    uploadKyc,
  };
};
