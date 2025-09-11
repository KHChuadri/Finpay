import mongoose, { InferSchemaType } from "mongoose";

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderEmail: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'Request'
});

export type RequestType = InferSchemaType<typeof requestSchema>;
export default mongoose.model('Request', requestSchema);