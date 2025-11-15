import React, { useContext, useEffect } from 'react';
import { CallContext } from '../../context/CallContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const CallPage = () => {
  const {
    callState,
    callControls,
    remoteVideoMuted,
    localVideoRef,
    remoteVideoRef,
    toggleAudio,
    toggleVideo,
    endCall,
    formatDuration,
  } = useContext(CallContext);

  // Force play on mobile devices
  useEffect(() => {
    const playVideo = async () => {
      try {
        if (remoteVideoRef.current) {
          await remoteVideoRef.current.play().catch(err => {
            console.log('Autoplay prevented, attempting with user interaction:', err);
          });
        }
        if (localVideoRef.current && callState.callType === 'video') {
          await localVideoRef.current.play().catch(err => {
            console.log('Local video autoplay prevented:', err);
          });
        }
      } catch (error) {
        console.log('Video play error:', error);
      }
    };

    if (callState.isCallActive) {
      playVideo();
    }
  }, [callState.isCallActive, remoteVideoRef, localVideoRef, callState.callType]);

  if (!callState.isCallActive) {
    return null;
  }

  const otherUser = callState.isCaller ? callState.receiverInfo : callState.callerInfo;

  return (
    <div className='fixed inset-0 bg-black z-50 flex flex-col'>
      {/* Hidden audio element for audio calls */}
      {callState.callType === 'audio' && (
        <audio 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          webkit-playsinline="true"
        />
      )}
      
      {/* Remote Video - Full Screen */}
      <div className='relative flex-1 bg-gray-900'>
        {callState.callType === 'video' ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted={false}
              className='w-full h-full object-cover'
            />
            {/* Show overlay when remote user pauses video */}
            {remoteVideoMuted && (
              <div className='absolute inset-0 bg-gray-900 flex flex-col items-center justify-center'>
                <div className='w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-5xl font-bold mb-4'>
                  {otherUser?.fullName?.charAt(0).toUpperCase()}
                </div>
                <h2 className='text-white text-2xl font-semibold'>{otherUser?.fullName}</h2>
                <p className='text-gray-400 mt-2'>Video Paused</p>
              </div>
            )}
          </>
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center'>
            <div className='w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-5xl font-bold mb-4'>
              {otherUser?.fullName?.charAt(0).toUpperCase()}
            </div>
            <h2 className='text-white text-2xl font-semibold'>{otherUser?.fullName}</h2>
            <p className='text-gray-400 mt-2'>Audio Call</p>
          </div>
        )}

        {/* Local Video - Small preview (bottom right) */}
        {callState.callType === 'video' && (
          <div className='absolute bottom-24 right-6 w-40 h-52 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20'>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted
              className='w-full h-full object-cover'
            />
            {callControls.isVideoMuted && (
              <div className='absolute inset-0 bg-gray-900 flex items-center justify-center'>
                <div className='w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold'>
                  You
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Info Overlay (Top) */}
        <div className='absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-3 rounded-lg'>
          <p className='text-white font-medium'>{otherUser?.fullName}</p>
          <p className='text-gray-300 text-sm'>
            {callState.callType === 'video' ? 'Video Call' : 'Audio Call'}
          </p>
          {/* Call Duration Timer */}
          <p className='text-green-400 text-lg font-mono mt-1'>
            {formatDuration(callState.callDuration)}
          </p>
        </div>
      </div>

      {/* Call Controls - Bottom */}
      <div className='bg-gray-900/95 backdrop-blur-md py-6 px-6'>
        <div className='max-w-md mx-auto flex items-center justify-center gap-6'>
          {/* Mute/Unmute Audio */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              callControls.isAudioMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {callControls.isAudioMuted ? (
              <FaMicrophoneSlash size={24} className='text-white' />
            ) : (
              <FaMicrophone size={24} className='text-white' />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className='w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg'
          >
            <FaPhoneSlash size={28} className='text-white' />
          </button>

          {/* Mute/Unmute Video (only for video calls) */}
          {callState.callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                callControls.isVideoMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {callControls.isVideoMuted ? (
                <FaVideoSlash size={24} className='text-white' />
              ) : (
                <FaVideo size={24} className='text-white' />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallPage;
