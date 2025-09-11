import mongoose, { InferSchemaType } from "mongoose";

const transactionHistorySchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      required: false,
    },
    amountSrc: {
      type: Number,
      required: true,
    },
    currencySource: {
      type: String,
      required: true,
    },
    amountDest: {
      type: Number,
      required: true,
    },
    currencyDest: {
      type: String,
      required: true,
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromAccountEmail: {
      type: String,
      required: true,
    },
    toAccountEmail: {
      type: String,
      required: true,
    },
    fromAccountId: {
      type: String,
      required: true,
    },
    toAccountId: {
      type: String,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "TransactionHistory",
  }
);

export type TransactionHistoryType = InferSchemaType<typeof transactionHistorySchema>;
export default mongoose.model("TransactionHistory", transactionHistorySchema);
