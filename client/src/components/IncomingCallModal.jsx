import React, { useContext } from 'react';
import { CallContext } from '../../context/CallContext';
import { FaPhone, FaTimes, FaUserCircle } from 'react-icons/fa';

const IncomingCallModal = () => {
  const { callState, acceptCall, rejectCall } = useContext(CallContext);

  if (!callState.isIncomingCall) {
    return null;
  }

  const caller = callState.callerInfo;

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-violet-500 rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl animate-pulse-slow'>
        {/* Caller Avatar */}
        <div className='flex justify-center mb-6'>
          {caller?.profilePic ? (
            <img
              src={caller.profilePic}
              alt={caller.fullName}
              className='w-24 h-24 rounded-full object-cover border-4 border-violet-500 shadow-lg'
            />
          ) : (
            <FaUserCircle size={96} className='text-violet-500' />
          )}
        </div>

        {/* Caller Info */}
        <h2 className='text-white text-2xl font-bold mb-2'>{caller?.fullName}</h2>
        <p className='text-gray-300 mb-1'>
          Incoming {callState.callType === 'video' ? 'Video' : 'Audio'} Call
        </p>
        <p className='text-gray-500 text-sm mb-8'>{caller?.bio || 'Calling...'}</p>

        {/* Call Action Buttons */}
        <div className='flex gap-4 justify-center'>
          {/* Reject Call */}
          <button
            onClick={rejectCall}
            className='w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg'
          >
            <FaTimes size={28} className='text-white' />
          </button>

          {/* Accept Call */}
          <button
            onClick={acceptCall}
            className='w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg animate-bounce'
          >
            <FaPhone size={28} className='text-white' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
