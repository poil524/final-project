import mongoose from 'mongoose';
const { Schema } = mongoose;

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
        }
    },
    {timestamps: true})
// Create and export the User model based on the UserSchema
const User = mongoose.model('User', userSchema)
export default User;