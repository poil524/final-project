import mongoose from "mongoose";
const { Schema } = mongoose;

const evaluationSchema = mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    testResultId: { type: mongoose.Schema.Types.ObjectId, ref: "TestResult" },
    assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "pending" }, // pending, assigned, completed
    teacherFeedback: String,
    requirement: mongoose.Schema.Types.Mixed, // can store string or object
    answers: mongoose.Schema.Types.Mixed, // can store array or object
    assignedAt: Date,
    completedAt: Date
}, { timestamps: true });


const Evaluation = mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;
