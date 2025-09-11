import mongoose, { InferSchemaType } from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  addressLine1: {
    type: String,
    required: false,
  },
  addressLine2: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  collection: 'Address'
});

export type AddressType = InferSchemaType<typeof addressSchema>;
export default mongoose.model('Address', addressSchema);
