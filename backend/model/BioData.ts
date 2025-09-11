import mongoose, { InferSchemaType } from "mongoose"; 

const bioDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: false, 
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: false,
  },
}, {
  timestamps: true,
  collection: 'BioData'
}, );

export type BioDataType = InferSchemaType<typeof bioDataSchema>;
export default mongoose.model('BioData', bioDataSchema);
