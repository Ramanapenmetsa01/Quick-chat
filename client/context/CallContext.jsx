import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CallContext = createContext();

// Format duration from seconds to mm:ss
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const CallProvider = ({ children }) => {
  const { authUser, socket } = useContext(AuthContext);
  const [callState, setCallState] = useState({
    isCallActive: false,
    callType: null, // 'video' or 'audio'
    isCaller: false,
    callerInfo: null,
    receiverInfo: null,
    isIncomingCall: false,
    offer: null, // Store the offer for incoming calls
    callStartTime: null,
    callDuration: 0,
  });

  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const callTimerRef = useRef(null);

  const [callControls, setCallControls] = useState({
    isAudioMuted: false,
    isVideoMuted: false,
  });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // ICE servers configuration for WebRTC (including TURN for mobile/firewall)
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceTransportPolicy: 'all',
    iceCandidatePoolSize: 10,
  };

  // Set video streams when refs are available
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState.isCallActive]);

  // Timer for call duration
  useEffect(() => {
    if (callState.isCallActive && callState.callStartTime) {
      callTimerRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callState.callStartTime) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState.isCallActive, callState.callStartTime]);

  useEffect(() => {
    if (socket && authUser) {
      // Listen for incoming calls
      socket.on('incomingCall', ({ offer, callType, callerInfo }) => {
        setCallState({
          isCallActive: false,
          callType,
          isCaller: false,
          callerInfo,
          receiverInfo: authUser,
          isIncomingCall: true,
          offer, // Store the offer
        });
      });

      // Listen for call accepted
      socket.on('callAccepted', async ({ answer }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Listen for ICE candidates
      socket.on('iceCandidate', async ({ candidate }) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });

      // Listen for call rejected
      socket.on('callRejected', () => {
        toast.error('Call was rejected');
        endCall();
      });

      // Listen for call ended
      socket.on('callEnded', () => {
        toast('Call ended');
        endCall();
      });

      // Listen for remote video mute status
      socket.on('videoMuteStatus', ({ isMuted }) => {
        setRemoteVideoMuted(isMuted);
      });

      return () => {
        // Clean up socket listeners
        socket.off('incomingCall');
        socket.off('callAccepted');
        socket.off('iceCandidate');
        socket.off('callRejected');
        socket.off('callEnded');
        socket.off('videoMuteStatus');
      };
    }
  }, [socket, authUser]);

  const initiateCall = async (receiverInfo, callType) => {
    try {
      // Get user media first before setting state with mobile-friendly constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        } : false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      localStreamRef.current = stream;

      setCallState({
        isCallActive: true,
        callType,
        isCaller: true,
        callerInfo: authUser,
        receiverInfo,
        isIncomingCall: false,
        offer: null,
        callStartTime: Date.now(),
        callDuration: 0,
      });

      // Set stream to video element
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
      }, 0);

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('iceCandidate', {
            targetUserId: receiverInfo._id,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Create offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send call signal
      if (socket) {
        socket.emit('callUser', {
          receiverId: receiverInfo._id,
          offer,
          callType,
          callerInfo: authUser,
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access denied. Please allow permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found on your device.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/Microphone is already in use by another application.');
      } else {
        toast.error('Failed to access camera/microphone. Please check your device settings.');
      }
      
      // Reset state without calling endCall since call never started
      setCallState({
        isCallActive: false,
        callType: null,
        isCaller: false,
        callerInfo: null,
        receiverInfo: null,
        isIncomingCall: false,
        offer: null,
      });
    }
  };

  const acceptCall = async () => {
    try {
      // Get user media first before updating state with mobile-friendly constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callState.callType === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        } : false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      localStreamRef.current = stream;
      
      setCallState((prev) => ({ 
        ...prev, 
        isCallActive: true, 
        isIncomingCall: false,
        callStartTime: Date.now(),
        callDuration: 0,
      }));

      // Set stream to video element
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
      }, 0);

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('iceCandidate', {
            targetUserId: callState.callerInfo._id,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Set remote description with the offer we received
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(callState.offer));

      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      // Send answer to caller
      if (socket) {
        socket.emit('answerCall', {
          callerId: callState.callerInfo._id,
          answer,
        });
      }

      toast.success('Call accepted');
    } catch (error) {
      console.error('Error accepting call:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access denied. Please allow permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found on your device.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/Microphone is already in use by another application.');
      } else {
        toast.error('Failed to accept call. Please check your device settings.');
      }
      
      // Reject the call since we can't accept it
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (socket) {
      socket.emit('rejectCall', { callerId: callState.callerInfo._id });
    }
    setCallState({
      isCallActive: false,
      callType: null,
      isCaller: false,
      callerInfo: null,
      receiverInfo: null,
      isIncomingCall: false,
      offer: null,
      callStartTime: null,
      callDuration: 0,
    });
    setRemoteVideoMuted(false);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallControls((prev) => ({ ...prev, isAudioMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callState.callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isMuted = !videoTrack.enabled;
        setCallControls((prev) => ({ ...prev, isVideoMuted: isMuted }));
        
        // Notify remote user
        if (socket) {
          const targetUserId = callState.isCaller ? callState.receiverInfo._id : callState.callerInfo._id;
          socket.emit('videoMuteStatus', { targetUserId, isMuted });
        }
      }
    }
  };

  const endCall = () => {
    const duration = callState.callDuration;
    const otherUser = callState.isCaller ? callState.receiverInfo : callState.callerInfo;
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Save call log to chat if call was active for more than 3 seconds
    if (socket && duration >= 3 && otherUser) {
      const callLog = {
        type: 'call',
        callType: callState.callType,
        duration: formatDuration(duration),
        status: 'completed',
        receiverId: otherUser._id,
      };
      socket.emit('saveCallLog', callLog);
    }

    // Notify other user
    if (socket) {
      if (callState.isCaller && callState.receiverInfo) {
        socket.emit('endCall', { targetUserId: callState.receiverInfo._id });
      } else if (callState.callerInfo) {
        socket.emit('endCall', { targetUserId: callState.callerInfo._id });
      }
    }

    // Reset state
    setCallState({
      isCallActive: false,
      callType: null,
      isCaller: false,
      callerInfo: null,
      receiverInfo: null,
      isIncomingCall: false,
      offer: null,
      callStartTime: null,
      callDuration: 0,
    });

    setCallControls({
      isAudioMuted: false,
      isVideoMuted: false,
    });

    setRemoteVideoMuted(false);
    localStreamRef.current = null;
    peerConnectionRef.current = null;
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callControls,
        remoteVideoMuted,
        localVideoRef,
        remoteVideoRef,
        initiateCall,
        acceptCall,
        rejectCall,
        toggleAudio,
        toggleVideo,
        endCall,
        formatDuration,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
