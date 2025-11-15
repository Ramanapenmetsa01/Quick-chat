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
              className='w-full h-full object-contain'
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
          <div className='absolute bottom-36 right-4 w-32 h-40 md:w-40 md:h-52 md:right-6 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 z-40'>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted
              className='w-full h-full object-contain'
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
      <div className='fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pb-2'>
        <div className='bg-black/10 backdrop-blur-sm rounded-full px-4 py-2 shadow-2xl'>
          <div className='flex items-center justify-center gap-4'>
            {/* Mute/Unmute Audio */}
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl ${
                callControls.isAudioMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
              }`}
            >
              {callControls.isAudioMuted ? (
                <FaMicrophoneSlash size={26} className='text-white' />
              ) : (
                <FaMicrophone size={26} className='text-white' />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={endCall}
              className='w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl shadow-red-600/50'
            >
              <FaPhoneSlash size={32} className='text-white rotate-135' />
            </button>

            {/* Mute/Unmute Video (only for video calls) */}
            {callState.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 shadow-2xl ${
                  callControls.isVideoMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
                }`}
              >
                {callControls.isVideoMuted ? (
                  <FaVideoSlash size={26} className='text-white' />
                ) : (
                  <FaVideo size={26} className='text-white' />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;   