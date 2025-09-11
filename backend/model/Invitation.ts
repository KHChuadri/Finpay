import mongoose, { InferSchemaType } from "mongoose";

const invitationSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverName: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
  collection: 'Invitation'
}); 

export type InvitationType = InferSchemaType<typeof invitationSchema>;
export default mongoose.model('Invitation', invitationSchema);