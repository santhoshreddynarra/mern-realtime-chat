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

    // When the cron delivers a scheduled message, update the sender's UI from clock → tick
    const handleMessageSent = (sentMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === sentMessage._id ? { ...msg, status: 'sent' } : msg
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messages:read', handleMessagesRead);
    socket.on('message:sent', handleMessageSent);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messages:read', handleMessagesRead);
      socket.off('message:sent', handleMessageSent);
    };
  }, [socket, setMessages]);
};

export default useListenMessages;
