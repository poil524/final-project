import express from "express";
import { 
    createUser, 
    loginUser, 
    logoutUser, 
    getAllUsers, 
    getCurrentUserProfile, 
    updateCurrentProfile, 
    deleteUserById, 
    getUserById,
updateUserById } from "../controllers/userController.js";
import { authenticate, authorisedAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register or auto-login user
router.post("/", createUser);

router.get("/", authenticate, authorisedAdmin, getAllUsers); // admin only

// Standard login
router.post("/login", loginUser);

// Logout
router.post("/logout", logoutUser);

router.route('/profile').get(authenticate, getCurrentUserProfile).put(authenticate, updateCurrentProfile)

// Admin
router
.route('/:id')
.delete(authenticate, authorisedAdmin, deleteUserById)
.get(authenticate, authorisedAdmin, getUserById)
.put(authenticate, authorisedAdmin, updateUserById);

export default router;
