import mongoose from "mongoose";
import User from "../../model/User";
import UserChallengeProgress from "../../model/UserChallengeProgress";
import HTTPError from "http-errors";
import Challenge from "../../model/Challenge";

/**
 * <Get User's Challenge List>
 * 
 * @param {string} userId 
 * @param {number} page 
 * @param {number} limit 
 * @returns {success: boolean,
 *   challenge: Array of Challenge Object,
 *   currentPage: number,
 *   totalPayments: number,
 *   totalPages: number,
 * } object with challenge information, list of challenges, and status of process
 */
export const getChallenges = async (userId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  
  const user = await User.findById(userId);

  if (!user) {
    throw HTTPError(404, "getChallenges: User not found");
  }

  // Get ALL challenges from the Challenge collection
  const totalDocuments = await Challenge.countDocuments();

  // Fetch all challenges with pagination
  const allChallenges = await Challenge.find({})
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  // Get user progress for all challenges
  const userProgressList = await UserChallengeProgress.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).lean();

  // Create a map for quick lookup of user progress
  const progressMap = new Map();
  userProgressList.forEach(progress => {
    progressMap.set(progress.challengeId?.toString(), progress);
  });

  // Combine challenge data with user progress
  const challengeList = allChallenges.map(challenge => {
    const userProgress = progressMap.get(challenge._id.toString());
    
    return {
      _id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      exp: challenge.exp,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      category: challenge.category,
      progress: 0, // Default progress for challenge display
      amountToGoal: challenge.amountToGoal, // Make sure to include this field
      userProgress: userProgress ? [{
        _id: userProgress._id,
        userId: userProgress.userId,
        challengeId: userProgress.challengeId,
        progress: userProgress.progress,
        completed: userProgress.completed,
        lastCheckedDate: userProgress.lastCheckedDate,
        createdAt: userProgress.createdAt,
        updatedAt: userProgress.updatedAt
      }] : undefined
    };
  });
  
  const totalPages = Math.ceil(totalDocuments / limit);
  
  return {
    success: true,
    challenge: challengeList,
    currentPage: page,
    totalPayments: totalDocuments,
    totalPages: totalPages,
  };
}