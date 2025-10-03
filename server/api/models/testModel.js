import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const questionItemSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, required: true },
    text: String,
    options: [String],
    headingLabel: String,   // For matching label, answer = heading label
    //sentenceBegin: String,
    //sentenceEnd: String,
    summary: String,
});

const questionSchema = new mongoose.Schema({
    type: String,
    requirement: String,
    summary: String,    // for summary completion
    questionItems: [questionItemSchema],
    answers: [{
        id: { type: String, default: uuidv4, required: true },
        value: String,
        sourceText: String
    }],
    shuffle: { type: Boolean, default: false },
    shuffledItems: [
        {
            key: String,         // A, B, C
            text: String,        // heading text
            headingLabel: String // original label
        }
    ],
    shuffledEnds: [
        {
            key: String,
            value: String
        }
    ]
});

const passageSchema = new mongoose.Schema({
    header: String,
    text: String
});

const imageSchema = new mongoose.Schema({
    url: String
});

const sectionSchema = new mongoose.Schema({
    sectionTitle: String,
    passages: [passageSchema],
    questions: [questionSchema],
    images: [imageSchema]
});

const readingSchema = new mongoose.Schema({
    sections: [sectionSchema]
});

const testSchema = new mongoose.Schema({
    name: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: mongoose.Types.ObjectId,
    studentsTaken: { type: Number, default: 0 },
    reading: readingSchema
});

const Test = mongoose.model('Test', testSchema);
export default Test;
