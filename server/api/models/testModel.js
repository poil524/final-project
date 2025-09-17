import mongoose from 'mongoose';

const questionItemSchema = new mongoose.Schema({
    index: Number,
    text: String,
    options: [String],       
});

const questionSchema = new mongoose.Schema({
    type: String,            
    requirement: String,
    questionItems: [questionItemSchema],
    answers: [{ index: Number, value: String }]
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
