// Composition root for the profile slice: wires the real repository + the
// Cloudinary upload dependency once.
import HTTPError from "http-errors";
import streamifier from "streamifier";
import cloudinary from "../../../lib/cloudinaryClient";
import { createProfileService } from "./profile.service";
import { profileRepository } from "./profile.repository";

// Uploads a buffer to Cloudinary and resolves with its secure URL. The only
// place the profile slice touches Cloudinary directly.
const uploadImage = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) {
          reject(HTTPError(500, error?.message || "Cloudinary upload failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const profileService = createProfileService({
  repo: profileRepository,
  uploadImage,
});
