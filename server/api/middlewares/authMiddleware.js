import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token) {
        res.status(401);
        throw new Error("You must log in to use this feature.");
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