import { useEffect, useState, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';

const useTyping = (selectedUser) => {
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useSocketStore();
  const typingTimeoutRef = useRef(null);
  const isLocalTypingRef = useRef(false);

  // Listen for typing events from others
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTypingStart = ({ senderId }) => {
      if (senderId === selectedUser._id) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = ({ senderId }) => {
      if (senderId === selectedUser._id) {
        setIsTyping(false);
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      setIsTyping(false); // Reset when user changes or unmounts
    };
  }, [socket, selectedUser]);

  // Handle local typing to emit to others
  const handleTyping = () => {
    if (!socket || !selectedUser) return;

    if (!isLocalTypingRef.current) {
      isLocalTypingRef.current = true;
      socket.emit('typing:start', { receiverId: selectedUser._id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isLocalTypingRef.current = false;
      socket.emit('typing:stop', { receiverId: selectedUser._id });
    }, 800);
  };

  // Manually stop typing (e.g. when sending a message)
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && selectedUser && isLocalTypingRef.current) {
      isLocalTypingRef.current = false;
      socket.emit('typing:stop', { receiverId: selectedUser._id });
    }
  };

  // Cleanup local typing state when unmounting
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [socket, selectedUser]);

  return { isTyping, handleTyping, stopTyping };
};

export default useTyping;
