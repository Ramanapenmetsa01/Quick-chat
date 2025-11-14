import express from 'express'
import { checkAuth, login, signup, updateProfile,allUsers } from '../Controllers/userController.js'
import {protectRoute} from '../middleware/auth.js'
const userRouter=express.Router()

userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.put("/updateProfile",protectRoute,updateProfile)
userRouter.get("/check",protectRoute,checkAuth)
userRouter.get("/allUsers",protectRoute,allUsers)
export default userRouter