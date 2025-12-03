import mongoose from 'mongoose';
const { Schema } = mongoose;

const testResultSchema = new Schema({
    testId: { type: Schema.Types.ObjectId, ref: "Test" },
    testName: { type: String },
    type: { type: String },

    // store entire student answers
    answers: { type: Schema.Types.Mixed, default: {} },

    score: { type: Number, default: null }, 
    total: { type: Number, default: null }, 
    band: { type: Number, default: null },
    feedback: { type: Schema.Types.Mixed, default: {} },
    teacherFeedback: { type: Schema.Types.Mixed, default: null },

    isSubmitted: { type: Boolean, default: false },
    takenAt: { type: Date, default: Date.now },

    isEvaluated: {
        type: Schema.Types.Mixed,
        default: { requested: false, resultReceived: false }
    },
});


// Define the schema for the User model
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },

        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
        isTeacher: {
            type: Boolean,
            required: true,
            default: false,
        },
        testResults: { type: [testResultSchema], default: [] },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

    },
    { timestamps: true })
// Create and export the User model based on the UserSchema
const User = mongoose.model('User', userSchema)
export default User;