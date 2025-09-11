import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  exp: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ["pay", "receive", "save"],
    required: true
  },
  amountToGoal: {
    type: Number,
    required: true
  }
});

export type ChallengeType = mongoose.InferSchemaType<typeof challengeSchema>;
export default mongoose.model('Challenge', challengeSchema);