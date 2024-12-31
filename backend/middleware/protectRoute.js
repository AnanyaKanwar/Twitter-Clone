import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const protectRoute=async(req,res,next)=>{
    try {
        const token=req.cookies.jwt;
        // Extract token from cookies
        // req.cookies is an object that contains all the cookies sent by the client (usually the web browser) as part of the HTTP request.--This is made available through middleware like cookie-parser
        // jwt is the name of the specific cookie that contains the JSON Web Token.
        if(!token){
            return res.status(401).json({error:"Unauthorized:No Token Provided"});
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)

        if(!decoded){
            return res.status(401).json({error:"Unauthorized:Invalid Token"});
        }
        const user=await User.findById(decoded.userId).select("-password");
        // select("-password") is a Mongoose query modifier that excludes the password field from the retrieved user object.

        if(!user){
            return res.status(404).json({error:"User not found"});
        }

        req.user=user;
        // By assigning user to req.user, the user data becomes accessible throughout the request lifecycle.
        next();


    } catch (error) {
        return res.status(500).json({error:"Internal Server Error"});
        
    }
}