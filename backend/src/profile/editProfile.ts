import User from "../../model/User";
import BioData from "../../model/BioData";
import Address from "../../model/Address";
import mongoose from "mongoose";
import HTTPError from "http-errors";

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
export const editProfile = async (
  userId: string,
  payload: EditProfilePayload
) => {
  const user = await User.findById(new mongoose.Types.ObjectId(userId));

  if (!user) {
    throw HTTPError(404, "User not found");
  }

  const {
    firstName,
    lastName,
    dob,
    addressLine1,
    addressLine2,
    country,
    profileImg,
    accountType
  } = payload;

  // check if new data is provided in payload, if it is update it
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (accountType === "personal" || accountType === "business") {
    user.accountType = accountType;
  }
  
  let bioData = await BioData.findById(user.bioData);
  if (!bioData) {
    bioData = new BioData({ userId });
  }

  if (firstName !== undefined) bioData.firstName = firstName;
  if (lastName !== undefined) bioData.lastName = lastName;

  const normalizedDob = dob === "" ? null : dob;

  // check if dob given is valid
  if (normalizedDob !== undefined) {
    if (normalizedDob === null) {
      bioData.dateOfBirth = undefined;
    } else {
      const date = new Date(normalizedDob);
      if (isNaN(date.getTime())) {
        throw HTTPError(400, "Invalid date format");
      }

      const today = new Date();
      if (date > today) {
        throw HTTPError(400, "Date of birth cannot be in the future");
      }
      bioData.dateOfBirth = date;
    }
  }

  let address = await Address.findById(bioData.address);
  if (!address) {
    address = new Address({ userId });
  }

  if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (country !== undefined) address.country = country;

  if (typeof profileImg === "string") {
    user.profileImg = profileImg;
  }

  await address.save();
  bioData.address = address._id;

  await bioData.save();
  user.bioData = bioData._id;

  await user.save();

  return { message: "Profile updated" };
};
