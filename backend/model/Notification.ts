import mongoose, { InferSchemaType } from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Mission', 'Transfer', 'Request', 'Invitation'],
    required: true,
  },
  description: {
    type: String,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, createdAt : {
    type: Date,
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, {
  timestamps: true,
  collection: 'Notification'
}); 

export type NotificationType = InferSchemaType<typeof notificationSchema>;
export default mongoose.model('Notification', notificationSchema);