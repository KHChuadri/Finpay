import HTTPError from "http-errors";
import User from "../../model/User";
import cloudinary from "../../lib/cloudinaryClient";
import streamifier from "streamifier";

/**
 * <Upload User's verification Document>
 * 
 * @param {string} userId 
 * @param {Express.Multer.File} kycImg 
 * @returns 
 */
export const uploadKyc = async (
  userId: string,
  kycImg?: Express.Multer.File
) => {
  if (!userId) {
    throw HTTPError(400, "Missing user ID");
  }

  if (!kycImg) {
    throw HTTPError(400, "Missing KYC image");
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw HTTPError(404, "User not found");
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "kyc_users" },
        (error, result) => {
          if (error || !result) {
            reject(
              HTTPError(500, error?.message || "Cloudinary upload failed")
            );
          } else {
            resolve({ secure_url: result.secure_url });
          }
        }
      );
      streamifier.createReadStream(kycImg.buffer).pipe(uploadStream);
    }
  );

  // Update user KYC image
  user.KYCimg = uploadResult.secure_url;
  await user.save();

  return {
    success: true,
    imageUrl: uploadResult.secure_url,
  };
};
