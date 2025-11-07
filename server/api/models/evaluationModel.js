import mongoose from "mongoose";
const { Schema } = mongoose;

const evaluationSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    testResultId: { type: Schema.Types.ObjectId, ref: "User.testResults", required: true },
    assignedTeacher: { type: Schema.Types.ObjectId, ref: "User", default: null }, // null until assigned
    status: { type: String, enum: ["pending", "assigned", "completed"], default: "pending" },
    feedback: { type: Schema.Types.Mixed, default: {} }, // teacher's evaluation
    requestedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    completedAt: { type: Date },
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);
export default Evaluation;
