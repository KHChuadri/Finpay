import User from "../../model/User";
import BioData from "../../model/BioData";
import Address from "../../model/Address";
import mongoose from "mongoose";
import HTTPError from "http-errors";

interface ProfileResponse {
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

/**
 * <Get User Profile Information>
 * 
 * @param {string} userId 
 * @returns {ProfileResponse: ProfileResponse} object containing ProfileResponse object
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  const user = await User.findById(new mongoose.Types.ObjectId(userId));

  if (!user) {
    throw HTTPError(404, "User not found");
  }

  let bioData = null;
  let address = null;

  if (user.bioData) {
    bioData = await BioData.findById(user.bioData);

    if (bioData?.address) {
      address = await Address.findById(bioData.address);
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
    groups: user.groups.map((id) => id.toString()),
    rank: user.rank,
    exp: user.exp,
    depositId: user.depositId,
    accountType: user.accountType
  };
};
