import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  editProfileController,
  getProfileController,
  uploadKycController,
} from "./profile.controller";

const upload = multer({ storage: multer.memoryStorage() });

export const profileRouter = Router();

profileRouter.get(
  "/user/profile/:userId",
  asyncHandler(getProfileController)
);

// Registered before the `:userId` route below so "upload-kyc" isn't matched
// as a userId param, mirroring the inline route order in app.ts.
profileRouter.put(
  "/user/profile/upload-kyc",
  upload.single("kycImage"),
  asyncHandler(uploadKycController)
);

profileRouter.put(
  "/user/profile/:userId",
  upload.single("profileImg"),
  asyncHandler(editProfileController)
);
