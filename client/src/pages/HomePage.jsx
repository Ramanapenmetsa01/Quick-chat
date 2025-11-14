import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'

const HomePage = () => {
    const [selectedUser,setSelectedUser]=useState(false)
    const [openRightSidebar,setOpenRightSidebar]=useState(false)
  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
        <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-[100%] grid grid-cols-1 relative ${openRightSidebar
  ? "md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
  : "md:grid-cols-[1fr_2fr]"
}
`}>
            <Sidebar />
            <ChatContainer openRightSidebar={openRightSidebar} setOpenRightSidebar={setOpenRightSidebar}/>
            <RightSidebar openRightSidebar={openRightSidebar} setOpenRightSidebar={setOpenRightSidebar} selectedUser={selectedUser}/>
        </div>
    </div>
  )
}

export default HomePage
