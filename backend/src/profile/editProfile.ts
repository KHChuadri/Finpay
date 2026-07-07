import { profileService } from "../modules/profile/profile.container";

interface EditProfilePayload {
  firstName?: string;
  lastName?: string;
  dob?: string | Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
  profileImg?: string | null;
  accountType?: string | null;
}

/**
 * <Edits User Information>
 *
 * @param {string} userId
 * @param {EditProfilePayload} payload
 * @returns {message: string} object containing message "Profile updated"
 */
export const editProfile = (userId: string, payload: EditProfilePayload) =>
  profileService.editProfile(userId, payload);
