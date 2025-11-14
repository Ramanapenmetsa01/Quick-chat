import React, { useContext, useEffect, useState } from 'react'
import { FaUserCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { ChatContext } from '../../context/chatContext';
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = ({ openRightSidebar, setOpenRightSidebar }) => {
  const {selectedUser,messages}=useContext(ChatContext)
  const {onlineUsers}=useContext(AuthContext)
  const [msgImages,setMsgImages]=useState([])
  useEffect(()=>{
    setMsgImages(messages.filter(msg=>msg.image).map(msg=>msg.image))
  },[messages])
  return (
    openRightSidebar && selectedUser && (
      <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser && openRightSidebar ? "max-md:hidden" : ""}`}>
        
        <IoClose 
          size={24} 
          onClick={() => setOpenRightSidebar(false)}
          className="absolute top-4 right-4 cursor-pointer text-white hover:text-gray-300 transition-colors"
        />

        <div className='pt-14 flex flex-col items-center gap-2 text-[13px] font-light mx-auto'>
          
          {selectedUser.profilePic ? (
            <img
              className="w-20 aspect-[1/1] rounded-full object-cover"
              src={selectedUser.profilePic}
              alt=""
            />
          ) : (
            <FaUserCircle className="w-20 h-20 text-gray-300" />
          )}

          {/* ✅ Name smaller now */}
          <h1 className="px-8 text-lg font-medium mx-auto flex items-center gap-2">
            {onlineUsers.includes(selectedUser._id)&&<span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0"></span>}
            {selectedUser.fullName}
          </h1>

          <p className="px-6 mx-auto text-[10px] text-gray-200 text-center leading-tight">
            {selectedUser.bio || "No bio available"}
          </p>

        </div>
        <hr className='border-[#ffffff50] my-4 mx-3'/>
        <div className='px-5 text-xs'>
          <p>Media</p>
          <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
            {msgImages.map((url,index)=>(
              <div key={index} onClick={()=>window.open(url)}>
                <img src={url} alt='' className='h-full rounded-md'/>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    )
  );
};

export default RightSidebar;
