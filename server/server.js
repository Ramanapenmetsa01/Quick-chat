import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import  ConnectDB  from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import Message from "./models/message.js";
import {Server} from 'socket.io'
// create Express app and HTTP server
const app=express()
const server=http.createServer(app)

dotenv.config()
const PORT=process.env.PORT || 5000

// Initialize socket.io
export const io=new Server(server,{
    cors:{
        origin: [
            process.env.CLIENT_URL || "http://localhost:5173",
            "https://quick-chat-bay.vercel.app",
            "http://localhost:5173"
        ],
        credentials: true,
        methods: ['GET', 'POST']
    }
})

//store online users
export const userSocketMap={}// {userId:socketId}

//socket.io connection handler
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId

    if(userId){
        userSocketMap[userId]=socket.id
    }
    //emit online users to all connected clients
    
    io.emit("getOnlineUsers",Object.keys(userSocketMap))

    socket.on("disconnect",()=>{
        console.log("disconnected",userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })

    // Call signaling events
    socket.on("callUser", ({ receiverId, offer, callType, callerInfo }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incomingCall", {
                offer,
                callType,
                callerInfo
            });
        }
    });

    socket.on("answerCall", ({ callerId, answer }) => {
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("callAccepted", { answer });
        }
    });

    socket.on("iceCandidate", ({ targetUserId, candidate }) => {
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("iceCandidate", { candidate });
        }
    });

    socket.on("rejectCall", ({ callerId }) => {
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("callRejected");
        }
    });

    socket.on("endCall", ({ targetUserId }) => {
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("callEnded");
        }
    });

    socket.on("videoMuteStatus", ({ targetUserId, isMuted }) => {
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("videoMuteStatus", { isMuted });
        }
    });

    socket.on("saveCallLog", async ({ type, callType, duration, status, receiverId }) => {
        try {
            const callMessage = new Message({
                senderId: userId,
                receiverId,
                text: `${callType === 'video' ? '📹 Video' : '📞 Audio'} call ${status} - ${duration}`,
                messageType: 'call',
                callType,
                duration,
            });
            
            await callMessage.save();
            
            // Emit to both users if they are online
            const senderSocketId = userSocketMap[userId];
            const receiverSocketId = userSocketMap[receiverId];
            
            if (senderSocketId) {
                io.to(senderSocketId).emit("newMessage", callMessage);
            }
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", callMessage);
            }
        } catch (error) {
            console.error("Error saving call log:", error);
        }
    });
})
// middleware setup
app.use(express.json({limit:"4mb"}));
app.use(cors({
    origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "https://quick-chat-bay.vercel.app",
        "http://localhost:5173"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))


// Connect database
await ConnectDB()
app.get("/api/status",(req,res)=>{
    res.status(200).send("server is live")
})
// routes for user
app.use("/api/auth",userRouter);

//routes for messages
app.use("/api/messages",messageRouter);

server.listen(PORT,()=>{
    console.log("Server running on PORT ",PORT)
})