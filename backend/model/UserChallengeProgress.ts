import mongoose from "mongoose";

const userChallengeProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastCheckedDate: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'User_Challenge_Progress'
});

export type userChallengeProgressType = mongoose.InferSchemaType<typeof userChallengeProgressSchema>;
export default mongoose.model('UserChallengeProgress', userChallengeProgressSchema);