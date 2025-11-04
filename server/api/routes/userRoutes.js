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
    updateUserById,
    getAllTeachers,
    approveTeacher,
    rejectTeacher
} from "../controllers/userController.js";
import { authenticate, authorisedAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* Register or auto-login user
router.post("/", createUser);
*/
router.get("/", authenticate, authorisedAdmin, getAllUsers); // admin only

// Register routes
router.post("/register/student", (req, res, next) => {
    req.body.isTeacher = false;
    next();
}, createUser);

router.post("/register/teacher", (req, res, next) => {
    req.body.isTeacher = true;
    next();
}, createUser);


// Standard login
router.post("/login", loginUser);

// Logout
router.post("/logout", logoutUser);

router.route('/profile').get(authenticate, getCurrentUserProfile).put(authenticate, updateCurrentProfile)


// Admin
router.get("/teachers", authenticate, authorisedAdmin, getAllTeachers);

router.put("/:id/approve-teacher", authenticate, authorisedAdmin, approveTeacher);
router.put("/:id/reject-teacher", authenticate, authorisedAdmin, rejectTeacher);

router
    .route("/:id")
    .delete(authenticate, authorisedAdmin, deleteUserById)
    .get(authenticate, authorisedAdmin, getUserById)
    .put(authenticate, authorisedAdmin, updateUserById);


export default router;
