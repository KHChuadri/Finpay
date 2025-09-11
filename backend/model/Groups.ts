import mongoose, { InferSchemaType } from "mongoose";

const groupSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  transactionHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "TransactionHistory",
    required: true,
  }], 
  pendingInvite: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invitation",
    required: true,
  }],
  walletBalance: {
    type: Number,
    default: 0,
  },
  walletCurrency: {
    type: String,
    default: "AUD"
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  }
}, {
  timestamps: true,
  collection: 'Groups'
}); 

export type GroupType = InferSchemaType<typeof groupSchema>;
export default mongoose.model('Groups', groupSchema);