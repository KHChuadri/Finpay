import mongoose from "mongoose";

const ScheduledPaymentSchema = new mongoose.Schema({
    debtorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    creditorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    amountSrc: {
        type: Number,
        required: true
    },
    amountDest: {
        type: Number,
        required: true
    },
    currencySrc: {
        type: String,
        required: true
    },
    currencyDest: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "cancelled"],
        default: "pending"
    },
    processedAt: {
        type: Date
    },
    transactionId: {
        type: String
    },
    failureReason: {
        type: String
    },
    lastAttempt: {
        type: Date
    },
    jobId: {
        type: String
    }
}, {
    timestamps: true
});

export type ScheduledPaymentType = mongoose.InferSchemaType<typeof ScheduledPaymentSchema> & { _id: mongoose.Types.ObjectId };
export default mongoose.model('ScheduledPayment', ScheduledPaymentSchema);
