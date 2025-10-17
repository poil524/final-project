import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import userRoutes from "./api/routes/userRoutes.js";
import testRoutes from "./api/routes/testRoutes.js";
import authMiddleware from "./api/middlewares/authMiddleware.js";

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/final-project");

const app = express();
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use("/api/users", userRoutes); // public routes
app.use("/api/tests", authMiddleware, testRoutes); // protected routes

// --- 404 handler ---
app.use((req, res) => {
    res.status(404).send({ url: `${req.originalUrl} not found` });
});

// --- Start server ---
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
