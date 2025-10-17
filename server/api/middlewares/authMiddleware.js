import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed.");
    }
});

const authorisedAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(401).json({ message: "Not authorized as admin." });
    }
};


export { authenticate, authorisedAdmin };
export default authenticate;


/*
export default function (req, res, next) {
    console.log("Cookies Debug")
    console.log("Cookies:", req.cookies);
    console.log("Header token:", req.header("x-auth-token"));

    const token = req.header("x-auth-token") || req.cookies?.jwt;

    if (!token) {
        console.log("No token found in header or cookie");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        res.status(400).json({ message: "Invalid token" });
    }
}
*/