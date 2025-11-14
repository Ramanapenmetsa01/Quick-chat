import express from 'express'
import { protectRoute } from '../middleware/auth.js'
import { 
    outgoingRequests,
    removeOutgoingRequests,
    getMessages,
    getUsersForSidebar,
    markMessageAsSeen,
    sendMessage,
    incomingRequests,
    rejectRequests,
    acceptRequests
} from '../Controllers/messageController.js'

const messageRouter = express.Router()


messageRouter.get("/friendUsers", protectRoute, getUsersForSidebar)
messageRouter.get("/incomingRequests", protectRoute, incomingRequests)
messageRouter.put("/acceptRequests/:id", protectRoute, acceptRequests)  
messageRouter.delete("/rejectRequests/:id", protectRoute, rejectRequests)
messageRouter.put("/outgoingRequests/:id", protectRoute, outgoingRequests)
messageRouter.delete("/removeOutgoingRequests/:id", protectRoute, removeOutgoingRequests)

// MESSAGE ROUTES
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen)
messageRouter.post("/send/:id", protectRoute, sendMessage)
messageRouter.get("/:id", protectRoute, getMessages)

export default messageRouter
