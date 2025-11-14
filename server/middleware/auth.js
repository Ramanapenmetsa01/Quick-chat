import jwt from 'jsonwebtoken'
import User from '../models/User.js';
// middleware to protect routes

export const  protectRoute=async(req,res,next)=>{
    try {
        const token=req.headers.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
      return res.json({ success: false, message: "No token provided" });
    }
        const decoded=jwt.verify(token,process.env.SECRET)
        const user=await User.findById(decoded.userId).select("-password");
        if (!user) return res.json({success:false,message:"User not found"})
        req.user=user
        next()
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}