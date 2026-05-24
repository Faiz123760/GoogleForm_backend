import mongoose from "mongoose";

// Dedicated subdocument schema for Form Fields to prevent "type" field name collisions and Mongoose CastErrors
const fieldSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true }, // Field type (e.g. short_answer, paragraph)
    label: { type: String, required: true },
    placeholder: String,
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    
    // Quiz Mode configurations
    correctAnswer: { type: mongoose.Schema.Types.Mixed }, // Can be String or Array of Strings
    points: { type: Number, default: 0 },
    
    // Linear Scale configurations
    scaleMin: { type: Number, default: 1 },
    scaleMax: { type: Number, default: 5 },
    scaleMinLabel: String,
    scaleMaxLabel: String,

    // Grid configurations
    gridRows: { type: [String], default: [] },
    gridColumns: { type: [String], default: [] },

    conditionalLogic: {
        showIfFieldId: String,
        showIfValue: String
    }
}, { _id: false }); // Disable _id generation for nested fields subdocuments to maintain clean datasets

const formSchema = new mongoose.Schema({
    title: { type: String, default: "Untitled Form" },
    description: { type: String, default: "Form description" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fields: [fieldSchema], // Compiled cleanly as a standard Mongoose document array
    settings: {
        limitTo1Response: { type: Boolean, default: false },
        collectEmail: { type: Boolean, default: false },
        passwordProtected: { type: Boolean, default: false },
        passwordHash: String,
        expiryDate: Date,
        isQuiz: { type: Boolean, default: false },
    },
    published: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    theme: {
        primaryColor: { type: String, default: "#1a73e8" },
        backgroundColor: { type: String, default: "#f0f3f9" },
        textColor: { type: String, default: "#202124" },
        fontFamily: { type: String, default: "Roboto" },
        headerImage: String
    }
}, { timestamps: true });

export default mongoose.model('Form', formSchema);