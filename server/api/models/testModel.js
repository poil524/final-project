import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const questionItemSchema = new mongoose.Schema({
    id: { type: String, default: () => uuidv4(), required: true },
    text: { type: String, default: "" },
    options: { type: [String], default: [] }, // for multiple choice
    summary: { type: String, default: "" },
});

const answerSchema = new mongoose.Schema({
    id: { type: String, default: () => uuidv4(), required: true },
    value: { type: String, default: "" },
    sourceText: { type: String, default: "" },
});


const questionSchema = new mongoose.Schema({
    type: { type: String, default: "multiple_choice" },
    requirement: { type: String, default: "" },
    summary: { type: String, default: "" },
    questionItems: { type: [questionItemSchema], default: [] },
    answers: { type: [answerSchema], default: [] },

    featureListTitle: { type: String, default: "" },
    featureLabelType: { type: String, enum: ["A", "i"], default: "A" },
    features: { type: [String], default: [] },

    // Table Completion fields
    tableData: { type: [[String]], default: [] },

    // Speaking (separate keys for system TTS and student response)
    ttsKey: { type: String, default: "" },
    studentAudioKey: { type: String, default: "" },
});

const passageSchema = new mongoose.Schema({
    header: { type: String, default: "" },
    text: { type: String, default: "" },
});


const sectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, default: "" },
    passages: { type: [passageSchema], default: [] },
    questions: { type: [questionSchema], default: [] },
    images: { type: [String], default: [] },
    audioKey: { type: String, default: "" },
    transcript: { type: String, default: "" },
    requirement: { type: String, default: "" },
});

const testSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["reading", "listening", "writing", "speaking"], required: true },
    sections: { type: [sectionSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentsTaken: { type: Number, default: 0 },

    isApproved: { type: Boolean, default: false },

});

const Test = mongoose.model("Test", testSchema);
export default Test;
