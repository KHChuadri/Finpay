import { profileService } from "../modules/profile/profile.container";

/**
 * <Get User Profile Information>
 *
 * @param {string} userId
 * @returns {ProfileResponse: ProfileResponse} object containing ProfileResponse object
 */
export const getProfile = (userId: string) => profileService.getProfile(userId);
