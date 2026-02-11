import React, { useState, useRef, useEffect, useContext } from 'react'
import { FaSearch, FaUserCircle, FaUserPlus, FaUserCheck, FaTimes, FaUserFriends } from "react-icons/fa";
import RequestsPage from './RequestsPage';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AddFriendPage = ({ onClose }) => {
  const { axios, authUser } = useContext(AuthContext)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [addedFriends, setAddedFriends] = useState(new Set())
  const [requestedList, setRequestedList] = useState(new Set())
  const [showRequests, setShowRequests] = useState(false)
  const scrollRef = useRef()

  // Fetch users from backend
  const fetchUsers = async (pageNum, search) => {
    if (loading) return

    setLoading(true)
    try {
      const response = await axios.get(`/api/auth/allUsers?page=${pageNum}&searchQuery=${search.trim()}`)

      if (response.data.success) {
        const newUsers = response.data.all_users || []

        // If it's page 1 or new search, replace users; otherwise append
        if (pageNum === 1) {
          setUsers(newUsers)
          setRequestedList(new Set(authUser.outgoingRequests))
          setAddedFriends(new Set(authUser.friends))
        } else {
          setUsers(prev => [...prev, ...newUsers])
        }

        // If less than 10 users, no more pages available
        setHasMore(newUsers.length >= 10)
      } else {
        toast.error(response.data.message || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }



  // Reset and reload when search changes
  useEffect(() => {
    setUsers([])
    setPage(1)
    setHasMore(true)
    fetchUsers(1, searchQuery)
  }, [searchQuery])

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchUsers(nextPage, searchQuery)
    }
  }

  const handleAddRequest = async (userId) => {
    try {
      const response = await axios.put(`/api/messages/outgoingRequests/${userId}`)
      if (response.data.success) {
        setRequestedList(prev => new Set(prev).add(userId))
      } else {
        toast.error(response.data.message || 'Failed to add request')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.message || 'Failed to add request')
    }
  }


  const handleRemoveRequest = async (userId) => {
    try {
      const response = await axios.delete(`/api/messages/removeOutgoingRequests/${userId}`)
      if (response.data.success) {
        setRequestedList(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      } else {
        toast.error(response.data.message || 'Failed to add request')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.message || 'Failed to delete request')
    }
  }
  const handleRemoveFriend = (userId) => {
    setAddedFriends(prev => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }


  return (
    <>
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-[#1a1625] border-2 border-gray-600 rounded-2xl w-full max-w-sm h-[70vh] flex flex-col overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between p-5 border-b border-gray-600'>
            <h2 className='text-2xl font-semibold text-white'>Add Friends</h2>
            <div className='flex items-center gap-3'>
              <FaUserFriends
                size={22}
                onClick={() => setShowRequests(true)}
                className='cursor-pointer text-gray-400 hover:text-violet-400 transition-colors'
                title='Friend Requests'
              />
              <FaTimes
                size={24}
                onClick={onClose}
                className='cursor-pointer text-gray-400 hover:text-white transition-colors'
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className='p-5 border-b border-gray-600'>
            <div className='bg-[#282142] rounded-full flex items-center gap-3 py-3 px-4'>
              <FaSearch size={18} className='text-gray-400' />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='bg-transparent border-none outline-none text-white text-sm placeholder-gray-400 flex-1'
                placeholder='Search users...'
              />
            </div>
          </div>

          {/* Users List */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className='flex-1 overflow-y-auto p-5'
          >
            {users.length === 0 && !loading ? (
              <div className='text-center text-gray-400 mt-10'>
                <p className='text-lg'>No users found</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {users.map((user) => {
                  const isFriend = addedFriends.has(user._id)
                  const isRequested = requestedList.has(user._id)

                  return (
                    <div
                      key={user._id}
                      className='flex items-center gap-4 p-3 rounded-lg bg-[#282142]/30 hover:bg-[#282142]/50 transition-colors'
                    >
                      {/* Profile Picture */}
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <FaUserCircle
                          size={48}
                          className="w-12 h-12 text-gray-400 flex-shrink-0"
                        />
                      )}

                      {/* User Info */}
                      <div className='flex-1 min-w-0'>
                        <p className='text-white font-medium text-base truncate'>{user.fullName}</p>
                        <p className='text-gray-400 text-sm truncate'>{user.bio}</p>
                      </div>


                      {/* Add/Friend Button */}
                      {isFriend ? (
                        <button
                          onClick={() => handleRemoveFriend(user._id)}
                          className='flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex-shrink-0'
                        >
                          <FaUserCheck size={16} />
                          <span className='text-sm font-medium'>Friends</span>
                        </button>
                      ) : (isRequested ? (
                        <button
                          onClick={() => handleRemoveRequest(user._id)}
                          className='flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex-shrink-0'
                        >
                          <FaUserCheck size={16} />
                          <span className='text-sm font-medium'>Requested</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddRequest(user._id)}
                          className='flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500 hover:bg-violet-600 text-white transition-colors flex-shrink-0'
                        >
                          <FaUserPlus size={16} />
                          <span className='text-sm font-medium'>Add</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className='text-center py-4'>
                <div className='inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            )}

            {/* No More Users */}
            {!hasMore && users.length > 0 && (
              <p className='text-center text-gray-500 text-sm py-4'>No more users to load</p>
            )}
          </div>
        </div>
      </div>

      {/* REQUESTS MODAL */}
      {showRequests && <RequestsPage onClose={() => setShowRequests(false)} />}
    </>
  )
}

export default AddFriendPage
