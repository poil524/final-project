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


const createUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const isTeacher = req.body.isTeacher === true || req.body.isTeacher === "true";

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

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        isTeacher, // now explicitly boolean
    });

    const token = generateTokenAndSetCookie(newUser, res);
    res.status(201).json({
        message: "User registered successfully.",
        user: newUser,
        token,
    });
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
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});


const updateCurrentProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
        user.username = req.body.username || user.username
        user.email = req.body.email || user.email

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt); 
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
    const user = await User.findById(req.params.id); 

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

const getAllTeachers = asyncHandler(async (req, res) => {
    const teachers = await User.find({ isTeacher: true });
    res.json(teachers);
});


const approveTeacher = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user || !user.isTeacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    user.status = "approved";
    await user.save();
    res.json({ message: "Teacher approved" });
});

const rejectTeacher = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user || !user.isTeacher) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    user.status = "rejected";
    await user.save();
    res.json({ message: "Teacher rejected" });
});

const getProfile = async (req, res) => {
    console.log("Get Profile");
    try {
        const user = await User.findById(req.user.id).lean().exec();
        console.log("[DEBUG] Raw user from DB:", user);

        if (!user) return res.status(404).json({ error: "User not found" });

        const profileData = {
            ...user,
            createdAt: user.createdAt?.toISOString() || null,
            testResults: (user.testResults || []).map(tr => ({
                ...tr,
                takenAt: tr.takenAt?.toISOString() || null,
                createdAt: tr.createdAt?.toISOString() || null
            })),
        };

        console.log("[DEBUG] Profile data sent to client:", profileData);

        res.json(profileData);
    } catch (err) {
        console.error("[DEBUG] Error fetching profile:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export {
    createUser,
    loginUser,
    logoutUser,
    getAllUsers,
    getCurrentUserProfile,
    updateCurrentProfile,
    deleteUserById,
    getUserById,
    updateUserById,
    getAllTeachers,
    approveTeacher,
    rejectTeacher,
    getProfile
};

