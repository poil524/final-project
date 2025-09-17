import User from "../models/userModel.js"
import asyncHandler from '../middlewares/asyncHandler.js'

const createUser = asyncHandler(async(req, res) => {
    const {username, email, password} = req.body
    console.log(username);
    if (!username || !email || !password){
        throw new Error('Please fill all the fields.');
    }
});

export {createUser};