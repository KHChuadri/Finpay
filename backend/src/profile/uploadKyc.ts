import { profileService } from "../modules/profile/profile.container";

/**
 * <Upload User's verification Document>
 *
 * @param {string} userId
 * @param {Express.Multer.File} kycImg
 * @returns
 */
export const uploadKyc = (userId: string, kycImg?: Express.Multer.File) =>
  profileService.uploadKyc(userId, kycImg);
