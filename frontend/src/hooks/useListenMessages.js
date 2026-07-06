import { useEffect } from 'react';
import { useSocketStore } from '../store/useSocketStore';

const useListenMessages = (messages, setMessages) => {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    const handleMessagesRead = ({ readerId }) => {
      setMessages((prevMessages) => 
        prevMessages.map((msg) => 
          msg.receiverId === readerId ? { ...msg, status: 'read' } : msg
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messages:read', handleMessagesRead);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messages:read', handleMessagesRead);
    };
  }, [socket, setMessages]);
};

export default useListenMessages;
