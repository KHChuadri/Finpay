import mongoose from "mongoose";
import User from "../../../model/User";
import BioData from "../../../model/BioData";
import Address from "../../../model/Address";
import type {
  AddressPatch,
  BioDataPatch,
  IProfileRepository,
  ProfileAddressRecord,
  ProfileBioDataRecord,
  ProfileUserRecord,
  UserProfilePatch,
} from "./profile.types";

const toUserRecord = (doc: {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  passwordLength?: number | null;
  isVerified: boolean;
  isLocked: boolean;
  KYCimg?: string | null;
  profileImg?: string | null;
  groups: unknown[];
  rank?: string | null;
  exp?: number | null;
  depositId: string;
  accountType: string;
  bioData?: unknown;
}): ProfileUserRecord => ({
  id: String(doc._id),
  firstName: doc.firstName,
  lastName: doc.lastName,
  email: doc.email,
  passwordLength: doc.passwordLength ?? null,
  isVerified: doc.isVerified,
  isLocked: doc.isLocked,
  KYCimg: doc.KYCimg ?? null,
  profileImg: doc.profileImg ?? null,
  groups: (doc.groups ?? []).map((id) => String(id)),
  rank: doc.rank ?? null,
  exp: doc.exp ?? null,
  depositId: doc.depositId,
  accountType: doc.accountType,
  bioDataId: doc.bioData ? String(doc.bioData) : null,
});

const toBioDataRecord = (doc: {
  _id: unknown;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  address?: unknown;
}): ProfileBioDataRecord => ({
  id: String(doc._id),
  firstName: doc.firstName,
  lastName: doc.lastName,
  dateOfBirth: doc.dateOfBirth ?? null,
  addressId: doc.address ? String(doc.address) : null,
});

const toAddressRecord = (doc: {
  _id: unknown;
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
}): ProfileAddressRecord => ({
  id: String(doc._id),
  addressLine1: doc.addressLine1 ?? null,
  addressLine2: doc.addressLine2 ?? null,
  country: doc.country ?? null,
});

export const profileRepository: IProfileRepository = {
  async findUserById(userId) {
    const doc = await User.findById(userId);
    return doc ? toUserRecord(doc) : null;
  },

  async findBioDataById(id) {
    const doc = await BioData.findById(id);
    return doc ? toBioDataRecord(doc) : null;
  },

  async findAddressById(id) {
    const doc = await Address.findById(id);
    return doc ? toAddressRecord(doc) : null;
  },

  async upsertAddress(id, userId, patch: AddressPatch) {
    let doc = id ? await Address.findById(id) : null;
    if (!doc) {
      doc = new Address({ userId });
    }

    if (patch.addressLine1 !== undefined) doc.addressLine1 = patch.addressLine1;
    if (patch.addressLine2 !== undefined) doc.addressLine2 = patch.addressLine2;
    if (patch.country !== undefined) doc.country = patch.country;

    await doc.save();
    return { id: String(doc._id) };
  },

  async upsertBioData(id, userId, patch: BioDataPatch) {
    let doc = id ? await BioData.findById(id) : null;
    if (!doc) {
      doc = new BioData({ userId });
    }

    if (patch.firstName !== undefined) doc.firstName = patch.firstName;
    if (patch.lastName !== undefined) doc.lastName = patch.lastName;
    if ("dateOfBirth" in patch) {
      doc.dateOfBirth = patch.dateOfBirth;
    }
    doc.address = new mongoose.Types.ObjectId(patch.addressId);

    await doc.save();
    return { id: String(doc._id) };
  },

  async updateUser(userId, patch: UserProfilePatch) {
    const doc = await User.findById(userId);
    if (!doc) {
      return;
    }

    if (patch.firstName !== undefined) doc.firstName = patch.firstName;
    if (patch.lastName !== undefined) doc.lastName = patch.lastName;
    if (patch.accountType !== undefined) doc.accountType = patch.accountType;
    if (patch.profileImg !== undefined) doc.profileImg = patch.profileImg;
    doc.bioData = new mongoose.Types.ObjectId(patch.bioDataId);

    await doc.save();
  },

  async setUserKycImage(userId, imageUrl) {
    const doc = await User.findById(userId);
    if (!doc) {
      return;
    }

    doc.KYCimg = imageUrl;
    await doc.save();
  },
};
