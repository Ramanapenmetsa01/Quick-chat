
import Message from "../models/message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from '../server.js'

// get all users except the logged in user that are friends
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate("friends", "fullName profilePic bio").select("friends");
        const unseenMessages = {}
        const promises = user.friends.map(async (friendId) => {
            const messages = await Message.find({ senderId: friendId, receiverId: userId, seen: false })

            if (messages.length > 0) {
                unseenMessages[friendId] = messages.length
            }
        })
        await Promise.all(promises)
        res.json({ success: true, users: user.friends, unseenMessages })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });
        res.json({ success: true, messages })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body
        const receiverId = req.params.id
        const senderId = req.user._id
        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }
        const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl })
        // Emit the new message to the receivers socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }
        res.json({ success: true, newMessage });

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}


// add request
export const outgoingRequests = async (req, res) => {
    try {
        const { id:friendId } = req.params
        const myId = req.user._id
        if (friendId === String(myId)) {
            return res.json({ success: false, message: "You cannot add yourself" });
        }

        // Add friend to me
        await User.findByIdAndUpdate(myId, {
            $addToSet: { outgoingRequests: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $addToSet: { incomingRequests: myId }
        }); 
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}


// remove  request from sender
export const removeOutgoingRequests = async (req, res) => {
    try {
        const { id:friendId } = req.params
        const myId = req.user._id
        // Add friend to me
        await User.findByIdAndUpdate(myId, {
            $pull: { outgoingRequests: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { incomingRequests: myId }
        }); 
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// accept  request from receiver
export const acceptRequests = async (req, res) => {
    try {
        const { id:friendId } = req.params
        const myId = req.user._id
        
        await User.findByIdAndUpdate(friendId, {
            $pull: { outgoingRequests: myId }
        });
        await User.findByIdAndUpdate(myId, {
            $pull: { incomingRequests: friendId }
        });
        await User.findByIdAndUpdate(myId, {
            $addToSet: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: myId }
        });
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// remove reject from receiver
export const rejectRequests = async (req, res) => {
    try {
        const { id:friendId } = req.params
        const myId = req.user._id
        // Add friend to me
        await User.findByIdAndUpdate(friendId, {
            $pull: { outgoingRequests: myId }
        });
        await User.findByIdAndUpdate(myId, {
            $pull: { incomingRequests: friendId }
        });
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// incoming  request for a user
export const incomingRequests = async (req, res) => {
    try {
        const currentPage=parseInt(req.query.page) || 1;
        const itemsPerPage=10
        const skip=(currentPage-1)*itemsPerPage
        const myId=req.user._id
          
        const me = await User.findById(myId).select("incomingRequests");

        if (!me) {
            return res.json({ success: false, message: "User not found" });
        }

        const incomingIds = me.incomingRequests; 

        // If no incoming requests
        if (!incomingIds.length) {
            return res.json({ success: true, incomingUsers: []});
        }

        // Step 2: Get actual user details of those IDs
        const incomingUsers = await User.find({ _id: { $in: incomingIds } })
            .skip(skip)
            .limit(itemsPerPage)
            .select("fullName profilePic bio");

        res.json({
            success: true,
            incomingUsers
        });
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
