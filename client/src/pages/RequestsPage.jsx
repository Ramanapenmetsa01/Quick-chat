import React, { useState, useRef, useEffect, useContext } from 'react'
import { FaUserCircle, FaCheck, FaTimes } from "react-icons/fa";
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RequestsPage = ({ onClose }) => {
  const { axios } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef();

  // Fetch friend requests from backend
  const fetchRequests = async (pageNum) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/messages/incomingRequests?page=${pageNum}`);

      if (response.data.success) {
        const newRequests = response.data.incomingUsers || [];

        if (pageNum === 1) {
          setRequests(newRequests);
        } else {
          setRequests(prev => [...prev, ...newRequests]);
        }

        setHasMore(newRequests.length >= 10);
      } else {
        toast.error(response.data.message || 'Failed to load requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Load initial
  useEffect(() => {
    fetchRequests(1);
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRequests(nextPage);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const response = await axios.put(`/api/messages/acceptRequests/${requestId}`);

      if (response.data.success) {
        setRequests(prev => prev.filter(req => req._id !== requestId));
        toast.success("Friend request accepted!");
      } else {
        toast.error(response.data.message || "Failed to accept request");
      }
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await axios.delete(`/api/messages/rejectRequests/${requestId}`);

      if (response.data.success) {
        setRequests(prev => prev.filter(req => req._id !== requestId));
        toast.success("Friend request rejected");
      } else {
        toast.error(response.data.message || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
      <div className='bg-[#1a1625] border-2 border-gray-600 rounded-2xl w-full max-w-sm h-[70vh] flex flex-col overflow-hidden'>
        
        {/* Header */}
        <div className='flex items-center justify-between p-5 border-b border-gray-600'>
          <h2 className='text-2xl font-semibold text-white'>Friend Requests</h2>
          <FaTimes
            size={24}
            onClick={onClose}
            className='cursor-pointer text-gray-400 hover:text-white transition-colors'
          />
        </div>

        {/* Requests List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto p-5'
        >
          {requests.length === 0 && !loading ? (
            <div className='text-center text-gray-400 mt-10'>
              <p className='text-lg'>No friend requests</p>
              <p className='text-sm mt-2'>When someone sends you a friend request, it will appear here</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {requests.map((req) => (
                <div
                  key={req._id}
                  className='flex flex-col gap-3 p-4 rounded-lg bg-[#282142]/30 border border-gray-600/30'
                >

                  {/* User Info */}
                  <div className='flex items-center gap-3'>
                    {req.profilePic ? (
                      <img
                        src={req.profilePic}
                        alt={req.fullName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <FaUserCircle
                        size={48}
                        className="w-12 h-12 text-gray-400 flex-shrink-0"
                      />
                    )}

                    <div className='flex-1 min-w-0'>
                      <p className='text-white font-medium text-base truncate'>{req.fullName}</p>
                      <p className='text-gray-400 text-sm truncate'>{req.bio}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleAccept(req._id)}
                      className='flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors'
                    >
                      <FaCheck size={14} />
                      <span className='text-sm font-medium'>Accept</span>
                    </button>

                    <button
                      onClick={() => handleReject(req._id)}
                      className='flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors'
                    >
                      <FaTimes size={14} />
                      <span className='text-sm font-medium'>Reject</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className='text-center py-4'>
              <div className='inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin'></div>
            </div>
          )}

          {!hasMore && requests.length > 0 && (
            <p className='text-center text-gray-500 text-sm py-4'>
              No more requests to load
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;
