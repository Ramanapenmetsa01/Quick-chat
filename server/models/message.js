import mongoose from "mongoose";

const messageSchema= new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    image:{
        type:String
    },
    text:{
        type:String
    },
    nonce: {
        type: String
    },
    seen:{
        type:Boolean,
        default:false
    },
    messageType:{
        type:String,
        enum:['text','image','call'],
        default:'text'
    },
    callType:{
        type:String,
        enum:['audio','video']
    },
    duration:{
        type:String
    }
},{timestamps:true})

const Message=mongoose.model("Message",messageSchema)

export default Message;