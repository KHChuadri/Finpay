import mongoose, { InferSchemaType } from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    otp: {
      type: String,
      required: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
  }
)

export type OtpType = InferSchemaType<typeof otpSchema> & { _id: mongoose.Types.ObjectId };
export default mongoose.model("Otp", otpSchema);