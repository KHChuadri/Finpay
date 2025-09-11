import User, { UserType } from "../../model/User";

/**
 * <Gets a list of users depending on page and limit per page>
 * 
 * @param {number} page 
 * @param {number} limit 
 * @returns {users: List of User Object, currentPage: number, totalRequest: number,
 *  totalPages: number} Object containing list of user that will fit in a certain page
 */
export const adminGetUser = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const userDocs = await User.find()
    .populate("bioData", "firstName lastName")
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments();

  const users = userDocs.map((user: UserType) => ({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    userId: user._id.toString(),
    isLocked: user.isLocked,
    isVerified: user.isVerified,
    email: user.email,
    updatedAt: user.updatedAt.toISOString(),
    KYCimg: user.KYCimg,
  }));

  return {
    users: users,
    currentPage: page,
    totalUsers: totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
  };
};
