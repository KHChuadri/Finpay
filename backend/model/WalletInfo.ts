import mongoose, { InferSchemaType } from "mongoose";

const walletInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  walletCurrency: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
  collection: 'WalletInfo'
});

export type WalletInfoType = InferSchemaType<typeof walletInfoSchema> & { _id: mongoose.Types.ObjectId };
export default mongoose.model('WalletInfo', walletInfoSchema);