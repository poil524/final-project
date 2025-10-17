import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Helper: generate JWT and set cookie
const generateTokenAndSetCookie = (user, res) => {
    const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return token;
};

// Register or auto-login if user exists
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error("Please fill all the fields.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const token = generateTokenAndSetCookie(existingUser, res);
        return res.status(200).json({
            message: "User already exists. Logged in automatically.",
            user: existingUser,
            token,
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({ username, email, password: hashedPassword });

    if (newUser) {
        const token = generateTokenAndSetCookie(newUser, res);
        console.log("[DEBUG] Cookie set for new user:", token.slice(0, 20) + "...");
        res.status(201).json({
            message: "User registered successfully.",
            user: newUser,
            token,
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data.");
    }
});

// Login existing user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please provide email and password.");
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error("User not found.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error("Invalid credentials.");
    }

    const token = generateTokenAndSetCookie(user, res);
    res.status(200).json({
        message: "Login successful.",
        user,
        token,
    });
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
    // Clear cookie on logout
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "lax",
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully." });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
    res.json(users);
})

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email
        })
    }
    else {
        res.status(404)
        throw new Error("User not found")
    }
})

const updateCurrentProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
        user.username = req.body.username || user.username
        user.email = req.body.email || user.email

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt); // use req.body.password
            user.password = hashedPassword;
        }


        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    }
    else {
        res.status(404)
        throw new Error("User not found")
    }
});

const deleteUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id); // <-- note 'params'

    if (user) {
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Admin user cannot be deleted');
        }
        await User.deleteOne({ _id: user._id });
        res.json({ message: "User removed" });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password')

    if (user) {
        res.json(user)
    } else {
        res.status(404);
        throw new Error("User not found");
    }
})

const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

    if (user) {
        user.username = req.body.username || user.username
        user.email = req.body.email || user.email
        user.isAdmin = Boolean(req.body.isAdmin)
        // TODO: Add isTeacher

        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        })
    } else {
        res.status(404);
        throw new Error("User not found");
    }
})
export {
    createUser,
    loginUser,
    logoutUser,
    getAllUsers,
    getCurrentUserProfile,
    updateCurrentProfile,
    deleteUserById,
    getUserById,
    updateUserById
};
