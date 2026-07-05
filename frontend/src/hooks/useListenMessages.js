import { useEffect } from 'react';
import { useSocketStore } from '../store/useSocketStore';

const useListenMessages = (messages, setMessages) => {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => socket.off('newMessage');
  }, [socket, setMessages]);
};

export default useListenMessages;
