import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
        index: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Nullable for anonymous submissions
    },
    answers: [{
        fieldId: {
            type: String,
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed, // Can be String, Array (checkboxes), Number, etc.
            required: true
        }
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        browser: String,
        device: String,
        os: String,
        submissionDuration: Number // Duration in seconds to fill out the form
    }
}, { timestamps: true });

// Optimize lookups with indexes
responseSchema.index({ formId: 1, createdAt: -1 });

export default mongoose.model('Response', responseSchema);
