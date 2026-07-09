import { Request, Response } from "express";
import { profileService } from "./profile.container";

export const getProfileController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const response = await profileService.getProfile(userId);
  res.json(response);
};

export const editProfileController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  let profileImg: Express.Multer.File | string | undefined;

  if (req.file) {
    profileImg = req.file;
  } else if (!req.file && req.body.profileImg !== undefined) {
    profileImg = req.body.profileImg;
  }

  const payload = {
    ...req.body,
    profileImg,
  };

  const response = await profileService.editProfile(userId, payload);
  res.json(response);
};

export const uploadKycController = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const kycImg = req.file;
  const response = await profileService.uploadKyc(userId, kycImg);
  res.json(response);
};
