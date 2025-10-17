import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const questionItemSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, required: true },
    text: String,
    options: [String],
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
    images: [imageSchema],
    audioUrl: String, // for listening
    transcript: String, // for listening
    requirement: String,
});
/*
const readingSchema = new mongoose.Schema({
    sections: [sectionSchema]
});
*/
const testSchema = new mongoose.Schema({
    name: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: mongoose.Types.ObjectId,
    studentsTaken: { type: Number, default: 0 },
    reading: { sections: [sectionSchema] },
    listening: { sections: [sectionSchema] },
    writing: { sections: [sectionSchema] }
});

const Test = mongoose.model('Test', testSchema);
export default Test;
