import React, { useContext, useEffect, useRef, useState } from 'react'

import { FaInfo, FaAngleLeft, FaUserCircle, FaPhone, FaVideo } from "react-icons/fa";
import { MdPhotoLibrary } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';
import { CallContext } from '../../context/CallContext';
import toast from 'react-hot-toast';

const ChatContainer = ({ setOpenRightSidebar }) => {
  const { messages, selectedUser, setSelectedUser,
    sendMessage, getMessages } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)
  const { initiateCall } = useContext(CallContext)
  const [input, setInput] = useState("")
  const scrollEnd = useRef()
  
  const handleVideoCall = () => {
    if (selectedUser) {
      initiateCall(selectedUser, 'video')
    }
  }

  const handleAudioCall = () => {
    if (selectedUser) {
      initiateCall(selectedUser, 'audio')
    }
  }
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === "") return null;
    await sendMessage({ text: input.trim() })
    setInput("")
  }

  // handle sending image an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) {
      toast.error("select an image file")
      return;
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result })
      e.target.value = ""
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(()=>{
    if(selectedUser){
      getMessages(selectedUser._id)
    }
  },[selectedUser])

  return selectedUser ? (

    <div className='h-full overflow-hidden relative backdrop-blur-lg flex flex-col'>

      {/* --- header--- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500 cursor-pointer' onClick={() => setOpenRightSidebar(true)} >
        {selectedUser.profilePic ?
          <img src={selectedUser.profilePic} alt="" className='w-8 h-8 rounded-full object-cover' />
          : <FaUserCircle size={22} color='white' />}
        <p className='flex-1 text-base font-medium text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>

        {/* Call Icons */}
        <FaVideo
          onClick={(e) => {
            e.stopPropagation();
            handleVideoCall();
          }}
          size={20}
          className="text-white hover:text-violet-400 cursor-pointer transition-colors"
          title="Video Call"
        />
        <FaPhone
          onClick={(e) => {
            e.stopPropagation();
            handleAudioCall();
          }}
          size={18}
          className="text-white hover:text-violet-400 cursor-pointer transition-colors"
          title="Audio Call"
        />

        <FaAngleLeft
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(null);
            setOpenRightSidebar(false)
          }}
          className=" max-w-7 cursor-pointer max-w-7 text-white " size={20}
        />
        <FaInfo
          size={20}
          className="text-white border border-white rounded-full p-[3px] cursor-pointer max-md:hidden max-w-5"
        />
      </div>
      {/* ---chat area--- */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>


        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
            ) : (
              <p className={`p-2 px-3 max-w-[200px] text-sm font-light rounded-lg mb-8 break-words bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
            )
            }
            <div className='text-center text-xs'>
              {
                msg.senderId === authUser._id ? (authUser.profilePic?(
                  <img src={authUser.profilePic} className='w-7 h-7 rounded-full object-cover' alt="" />):(<FaUserCircle size={20} color='white' />)
                ):(
                  selectedUser.profilePic?(
                  <img src={selectedUser.profilePic} className='w-7 h-7 rounded-full object-cover' alt="" />):(<FaUserCircle size={20} color='white' />)
                ) 
              }
              <p className='text-gray-500 text-xs'>{formatMessageTime(msg.createdAt)}</p>

            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>
      {/* ---bottom area--- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
          <input onChange={handleSendImage} type="file" id="image" accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <MdPhotoLibrary size={24} className="text-white w-5 mr-2 cursor-pointer" />
          </label>
        </div>
        <IoSend size={24} className="text-blue-400 w-7 cursor-pointer" onClick={handleSendMessage} />
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16 vibrate-smooth' />
      <p className='text-base font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer
