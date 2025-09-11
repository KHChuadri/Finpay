import mongoose, { InferSchemaType } from "mongoose";

const bankInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  routingNumber: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    enum: ["savings", "checking"],
    required: true,
  },
}, {
  timestamps: true,
  collection: 'BankInfo'
});

export type BankInfoType = InferSchemaType<typeof bankInfoSchema>;
export default mongoose.model('BankInfo', bankInfoSchema);
