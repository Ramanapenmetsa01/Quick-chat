import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { FaEllipsisV, FaSearch, FaUserCircle, FaUserPlus } from "react-icons/fa";

import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AddFriendPage from '../pages/AddFriendPage';
import { ChatContext } from '../../context/chatContext';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages } = useContext(ChatContext)
  const { logout, onlineUsers } = useContext(AuthContext)
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [input, setInput] = useState("")
  const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

  useEffect(() => {
    getUsers()
  }, [onlineUsers])
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <>
      <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll  text-white ${selectedUser ? 'max-md:hidden' : ""}`}>
        <div className='pb-5'>
          <div className='flex justify-between items-center'>

            <img src={assets.logo} alt="logo" className='max-w-40' />

            <div className='flex items-center gap-3'>
              {/* ADD FRIEND ICON */}
              <FaUserPlus
                size={20}
                className='cursor-pointer hover:text-violet-400 transition-colors'
                onClick={() => setShowAddFriend(true)}
              />

              {/* MENU WRAPPER */}
              <div
                className='relative py-2'
                ref={menuRef}
                onMouseEnter={() => setOpen(true)}
              >
                <FaEllipsisV
                  size={20}
                  className='cursor-pointer'
                />

                {open && (
                  <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100'>
                    <p
                      onClick={() => navigate('/profile')}
                      className='cursor-pointer text-sm'
                    >
                      Edit Profile
                    </p>

                    <hr className='my-2 border-t border-gray-500' />

                    <p className='cursor-pointer text-sm' onClick={logout}>Logout</p>
                  </div>
                )}

              </div>
            </div>

          </div>
          <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
            <FaSearch size={20} />
            <input type="text" onChange={(e) => setInput(e.target.value)} value={input} className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' placeholder='Search User...' />
          </div>
        </div>
        <div className='flex flex-col'>

          {/* No friends at all */}
          {users.length === 0 && (
            <p className='text-center text-gray-400'>
              You have no friends yet.
              <button
                onClick={() => setShowAddFriend(true)}
                className='ml-2 underline text-violet-400'
              >
                Add Friends
              </button>
            </p>
          )}

          {/* Search returned nothing */}
          {users.length > 0 && filteredUsers.length === 0 && (
            <p className='text-center text-gray-400 break-all'>
              No users match “{input}”.
            </p>
          )}

          {filteredUsers.map((user, index) => (
            <div onClick={()=>{ setSelectedUser(user); setUnseenMessages(prev=>({...prev,[user._id]:0}))}}
              key={index} className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedUser?._id === user?._id && 'bg-[#282142]/50'}`}>
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt=""
                  className="w-[35px] h-[35px] rounded-full object-cover"
                />
              ) : (
                <FaUserCircle
                  size={35}
                  className="w-[35px] h-[35px] rounded-full"
                />
              )}
              <div className='flex flex-col leading-5'>
                <p className='text-sm'>{user.fullName}</p>
                {
                  onlineUsers.includes(user._id) ? <span className='text-green-400 text-xs'>Online</span> : <span className='text-neutral-400 text-xs'>Offline</span>
                }
              </div>
              {unseenMessages[user._id] > 0 && <p className='absolute top-4 right-4 text-xs h-4.5 w-4.5 flex justify-center items-center rounded-full bg-violet-500/50'>{unseenMessages[user._id]}</p>}
            </div>

          ))}
        </div>
      </div>

      {/* ADD FRIEND MODAL */}
      {showAddFriend && <AddFriendPage onClose={() => setShowAddFriend(false)} />}
    </>
  );
};

export default Sidebar;
