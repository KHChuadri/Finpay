import { getDb } from "../../../lib/db";
import { users, bioData, addresses, groupMembers } from "../../db/schema";
import { eq } from "drizzle-orm";
import type {
  AddressPatch,
  BioDataPatch,
  IProfileRepository,
  ProfileAddressRecord,
  ProfileBioDataRecord,
  ProfileUserRecord,
  UserProfilePatch,
} from "./profile.types";

export const profileRepository: IProfileRepository = {
  async findUserById(userId): Promise<ProfileUserRecord | null> {
    const [u] = await getDb().select().from(users).where(eq(users.id, userId));
    if (!u) return null;
    const groupRows = await getDb()
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      passwordLength: u.passwordLength ?? null,
      isVerified: u.isVerified,
      isLocked: u.isLocked,
      KYCimg: u.kycImg ?? null,
      profileImg: u.profileImg ?? null,
      groups: groupRows.map((r) => r.groupId),
      rank: u.rank ?? null,
      exp: u.exp ?? null,
      depositId: u.depositId,
      accountType: u.accountType,
      bioDataId: u.bioDataId ?? null,
    };
  },

  async findBioDataById(id): Promise<ProfileBioDataRecord | null> {
    const [b] = await getDb().select().from(bioData).where(eq(bioData.id, id));
    return b
      ? {
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName,
          dateOfBirth: b.dateOfBirth ?? null,
          addressId: b.addressId ?? null,
        }
      : null;
  },

  async findAddressById(id): Promise<ProfileAddressRecord | null> {
    const [a] = await getDb().select().from(addresses).where(eq(addresses.id, id));
    return a
      ? {
          id: a.id,
          addressLine1: a.addressLine1 ?? null,
          addressLine2: a.addressLine2 ?? null,
          country: a.country ?? null,
        }
      : null;
  },

  async upsertAddress(id, userId, patch: AddressPatch) {
    if (id) {
      const existing = await getDb().select({ id: addresses.id }).from(addresses).where(eq(addresses.id, id));
      if (existing.length > 0) {
        await getDb()
          .update(addresses)
          .set({
            ...(patch.addressLine1 !== undefined && { addressLine1: patch.addressLine1 }),
            ...(patch.addressLine2 !== undefined && { addressLine2: patch.addressLine2 }),
            ...(patch.country !== undefined && { country: patch.country }),
          })
          .where(eq(addresses.id, id));
        return { id };
      }
    }
    const [a] = await getDb()
      .insert(addresses)
      .values({
        userId,
        addressLine1: patch.addressLine1 ?? null,
        addressLine2: patch.addressLine2 ?? null,
        country: patch.country ?? null,
      })
      .returning({ id: addresses.id });
    return { id: a.id };
  },

  async upsertBioData(id, userId, patch: BioDataPatch) {
    if (id) {
      const existing = await getDb().select({ id: bioData.id }).from(bioData).where(eq(bioData.id, id));
      if (existing.length > 0) {
        await getDb()
          .update(bioData)
          .set({
            ...(patch.firstName !== undefined && { firstName: patch.firstName }),
            ...(patch.lastName !== undefined && { lastName: patch.lastName }),
            ...("dateOfBirth" in patch && { dateOfBirth: patch.dateOfBirth ?? null }),
            addressId: patch.addressId,
          })
          .where(eq(bioData.id, id));
        return { id };
      }
    }
    const [b] = await getDb()
      .insert(bioData)
      .values({
        userId,
        firstName: patch.firstName ?? "",
        lastName: patch.lastName ?? "",
        dateOfBirth: patch.dateOfBirth ?? null,
        addressId: patch.addressId,
      })
      .returning({ id: bioData.id });
    return { id: b.id };
  },

  async updateUser(userId, patch: UserProfilePatch) {
    await getDb()
      .update(users)
      .set({
        ...(patch.firstName !== undefined && { firstName: patch.firstName }),
        ...(patch.lastName !== undefined && { lastName: patch.lastName }),
        ...(patch.accountType !== undefined && { accountType: patch.accountType }),
        ...(patch.profileImg !== undefined && { profileImg: patch.profileImg }),
        bioDataId: patch.bioDataId,
      })
      .where(eq(users.id, userId));
  },

  async setUserKycImage(userId, imageUrl) {
    await getDb().update(users).set({ kycImg: imageUrl }).where(eq(users.id, userId));
  },
};
