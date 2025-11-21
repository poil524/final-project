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
    rejectTeacher,
    requestEvaluation,
    assignTeacher,
    completeEvaluation,
    getStudentEvaluations,
    getTeacherAssignments,
    getPendingEvaluations, 
    getAssignedEvaluations
} from "../controllers/userController.js";
import { authenticate, authorisedAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Register or auto-login user

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


// Lists
router.get("/student", authenticate, getStudentEvaluations);
router.get("/teacher", authenticate, getTeacherAssignments);
// Admin: view all pending evaluation requests
router.get("/admin/requests/evaluations", authenticate, authorisedAdmin, getPendingEvaluations);

// Admin: view assigned evaluation requests
router.get("/admin/requests/evaluations/assigned", authenticate, authorisedAdmin, getAssignedEvaluations);


// Admin teacher list + approval flows
router.get("/teachers", authenticate, authorisedAdmin, getAllTeachers);
router.put("/:id/approve-teacher", authenticate, authorisedAdmin, approveTeacher);
router.put("/:id/reject-teacher", authenticate, authorisedAdmin, rejectTeacher);

// Student requests evaluation
router.post("/", authenticate, requestEvaluation);

// Admin assigns teacher
router.put("/:id/assign", authenticate, authorisedAdmin, assignTeacher);

// Teacher view assigned evaluations
router.get("/evaluations", authenticate, getTeacherAssignments);

// Teacher completes evaluation
router.put("/:id/complete", authenticate, completeEvaluation);

router
    .route("/:id")
    .delete(authenticate, authorisedAdmin, deleteUserById)
    .get(authenticate, authorisedAdmin, getUserById)
    .put(authenticate, authorisedAdmin, updateUserById);


export default router;
