import mongoose from 'mongoose';
const { Schema } = mongoose;

const testResultSchema = new Schema({
    testId: { type: Schema.Types.ObjectId, ref: "Test" },
    testName: { type: String },
    type: { type: String },
    score: { type: Number },
    total: { type: Number },
    band: { type: Number },
    feedback: { type: Schema.Types.Mixed },
    takenAt: { type: Date, default: Date.now },
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
    },
    { timestamps: true })
// Create and export the User model based on the UserSchema
const User = mongoose.model('User', userSchema)
export default User;