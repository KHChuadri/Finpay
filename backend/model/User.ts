import mongoose, { InferSchemaType } from "mongoose";
import { UUID } from "mongodb";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    existingPassword: [
      {
        type: String
      }
    ],
    password: {
      type: String,
      required: true,
    },
    passwordLength: {
      type: Number,
      required: false
    },
    bioData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BioData",
      required: false,
    },
    bankInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankInfo",
    },
    accountType: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
      required: true
    },
    walletInfo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WalletInfo",
      },
    ],
    transactionHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TransactionHistory",
      },
    ],
    request: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
      },
    ],
    tokens: [
      {
        type: String,
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Groups",
      },
    ],
    notification: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    invitation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invitation",
      },
    ],
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpiryDate: {
      type: Number,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    KYCimg: {
      type: String,
      default: null,
    },
    profileImg: {
      type: String,
      default: null,
    },
    lastNotificationSeen: {
      type: Date,
      default: new Date(),
    },
    depositId: {
      type: String,
      default: new UUID(),
    },
    rank: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
      required: true
    },
    exp: {
      type: Number,
      default: 0
    },
  }, {
  timestamps: true,
  collection: 'User'
});

export type UserType = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };;
export default mongoose.model("User", userSchema);
