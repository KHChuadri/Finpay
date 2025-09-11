import mongoose, { InferSchemaType } from "mongoose";

const transactionItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Deposit", "Withdraw"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "AUD",
    },
    amount: {
      type: Number,
      required: true,
    },
    depositId: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    }, name: {
      type: String,
      required: true
    },
  },
  {
    timestamps: true,
    collection: "TransactionItem",
  }
);

export type TransactionItemType = InferSchemaType<typeof transactionItemSchema> & { _id: mongoose.Types.ObjectId };
export default mongoose.model("TransactionItem", transactionItemSchema);
