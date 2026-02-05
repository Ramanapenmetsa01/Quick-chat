import { generateToken } from "../lib/utils.js";
import User from "../models/User.js"
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcrypt";

//signup a new user
export const signup=async(req,res)=>{
    const {fullName,email,password,bio}=req.body
    console.log(req.body)
    try {
        if(!fullName ||!email || !password ||!bio){
            console.log("hi")
            return res.json({success:false,message:"Missing Details"})
        }
        const user=await User.findOne({email});
        if (user){
            return res.json({success:false,message:"User already exists"})
        }
        const hashedPassword=await bcrypt.hash(password,10)
        const newUser=await User.create({
            fullName,email,password:hashedPassword,bio
        })
        const token=generateToken(newUser._id)
        
        res.json({success:true,token,message:"Account created succesfully",userData:newUser})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// login a user
export const login=async(req,res)=>{
    try {
        const {email,password}=req.body
        if(!email || !password){
           return res.json({success:false,message:"Missing Details"})
        }
        const UserData=await User.findOne({email})

        if (!UserData){
            return res.json({success:false,message:"Invalid credentails"})
        }

        const isPassCorrect=await bcrypt.compare(password,UserData.password)
        if (!isPassCorrect){
            return res.json({success:false,message:"Invalid credentails"})
        }

        const token=generateToken(UserData._id)
        
        res.json({success:true,token,message:"Login succesful",userData:UserData})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// controller to check if user is authenticated
export const checkAuth=(req,res)=>{
    res.json({success:true, user:req.user})
}

// controller to update user profile details

export const updateProfile=async (req,res)=>{
    try {
        const {profilePic,bio,fullName}=req.body
        const userId=req.user._id;
        let updatedUser;
        if (!profilePic){
            updatedUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }else{
            const upload=await cloudinary.uploader.upload(profilePic)
            updatedUser=await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }

        res.json({success:true,user:updatedUser})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}
let a=0

export const allUsers=async (req,res)=>{
    try {
        const currentPage=parseInt(req.query.page) || 1;
        const searchQuery=req.query.searchQuery || ""
        const itemsPerPage=10
        const skip=(currentPage-1)*itemsPerPage
        const myId=req.user._id
          // search filter
        const searchFilter = {
            _id: { $ne: myId },   
        };

        // If search query exists → search by name (fullName)
        if (searchQuery && searchQuery.trim() !== "") {
            searchFilter.fullName = {
                $regex: searchQuery.split("").join(".*"),
                $options: "i", // case-insensitive
            };
        }
        const all_users = await User.find(searchFilter).skip(skip).limit(itemsPerPage).select("fullName profilePic bio friends incomingRequests outgoingRequests")
        res.json({success:true,all_users})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}