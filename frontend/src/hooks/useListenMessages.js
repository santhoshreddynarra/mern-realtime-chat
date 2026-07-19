import { useEffect } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';

const useListenMessages = (setMessages, selectedUser) => {
  const { socket } = useSocketStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNewMessage = (newMessage) => {
      // Emit message:delivered back to server if we are not the sender
      if (newMessage.senderId !== authUser._id) {
        socket.emit('message:delivered', { messageId: newMessage._id, senderId: newMessage.senderId });
      }
      
      if (!selectedUser) return;
      
      const isMessageForCurrentChat = 
        newMessage.senderId === selectedUser._id || 
        newMessage.receiverId === selectedUser._id;
        
      if (!isMessageForCurrentChat) return;

      setMessages((prevMessages) => {
        // Guard: prevent duplicate messages if emitted more than once
        if (prevMessages.some((m) => m._id === newMessage._id)) return prevMessages;
        return [...prevMessages, newMessage];
      });
    };

    const handleMessagesRead = ({ readerId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.receiverId === readerId ? { ...msg, status: 'read' } : msg
        )
      );
    };

    const handleMessageDelivered = ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId && msg.status === 'sent' ? { ...msg, status: 'delivered' } : msg
        )
      );
    };

    // When cron delivers a scheduled message, flip sender's UI: clock → tick
    const handleMessageSent = (sentMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === sentMessage._id ? { ...msg, status: 'sent' } : msg
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messages:read', handleMessagesRead);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message:sent', handleMessageSent);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messages:read', handleMessagesRead);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message:sent', handleMessageSent);
    };
  }, [socket, setMessages, authUser, selectedUser]);
};

export default useListenMessages;
