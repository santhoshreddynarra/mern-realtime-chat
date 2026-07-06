import { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import useListenMessages from '../hooks/useListenMessages';
import useTyping from '../hooks/useTyping';
import Spinner from './Spinner';

const MessageContainer = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const { isTyping, handleTyping, stopTyping } = useTyping(selectedUser);

  useListenMessages(messages, setMessages); 

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
      } catch (error) {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Mark messages as read if the chat is open and there are unread messages
    const hasUnread = messages.some(msg => msg.senderId === selectedUser?._id && msg.status !== 'read');
    if (hasUnread && selectedUser) {
      axiosInstance.put(`/messages/read/${selectedUser._id}`).catch(err => console.log('Error marking read:', err));
    }
  }, [messages, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    stopTyping(); // Stop typing immediately upon sending

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, { message: newMessage });
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <p className="text-gray-500 font-medium text-lg">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 border-b flex items-center gap-3 h-18">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
          {selectedUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 leading-tight">{selectedUser.name}</span>
          <span className={`text-xs text-green-500 font-medium h-4 ${isTyping ? 'opacity-100' : 'opacity-0'}`}>
            typing...
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Send a message to start the conversation.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`flex ${msg.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg flex flex-col ${msg.senderId === authUser._id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                <span className="break-words">{msg.message}</span>
                {msg.senderId === authUser._id && (
                  <div className="flex justify-end mt-1 text-[11px] leading-none">
                    {msg.status === 'read' ? (
                      <span className="text-blue-300 font-bold tracking-tighter">✓✓</span>
                    ) : (
                      <span className="text-blue-200 opacity-70">✓</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value.trim().length > 0) {
              handleTyping();
            } else {
              stopTyping();
            }
          }}
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageContainer;
