import { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import { useConversationStore } from '../store/useConversationStore';
import { useSocketStore } from '../store/useSocketStore';
import toast from 'react-hot-toast';
import useListenMessages from '../hooks/useListenMessages';
import useTyping from '../hooks/useTyping';
import Spinner from './Spinner';

const MessageContainer = ({ selectedUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  
  // New Header Features State
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const menuRef = useRef(null);

  const fileInputRef = useRef(null);
  
  const { authUser } = useAuthStore();
  const { conversations } = useConversationStore();
  const messagesEndRef = useRef(null);
  const { isTyping, handleTyping, stopTyping } = useTyping(selectedUser);
  const { onlineUsers, offlineUsers } = useSocketStore();

  useListenMessages(setMessages, selectedUser);

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
    setMessages([]); // Clear messages when switching conversations
    setIsUserNearBottom(true);
    setReplyingTo(null);
    setImagePreview(null);
    setSelectedImage(null);
    if (selectedUser) {
      useConversationStore.getState().resetUnreadCount(selectedUser._id);
    }
  }, [selectedUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImagePreview(reader.result);
      setSelectedImage(reader.result);
      setSelectedImageFile(file);
    };
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (isUserNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const hasUnread = messages.some(msg => msg.senderId === selectedUser?._id && msg.status !== 'read');
    if (hasUnread && selectedUser) {
      axiosInstance.put(`/messages/read/${selectedUser._id}`).catch(err => console.log('Error marking read:', err));
    }
  }, [messages, selectedUser, isUserNearBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Consider near bottom if within 150px
    setIsUserNearBottom(scrollHeight - scrollTop - clientHeight < 150);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    stopTyping();
    setIsUserNearBottom(true); // Force scroll on self-send
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('message', newMessage);
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }
      if (isScheduling && scheduleDate) {
        formData.append('scheduledFor', new Date(scheduleDate).toISOString());
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      removeImage();
      setReplyingTo(null);
      setIsScheduling(false);
      setScheduleDate('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear messages in this chat?')) {
      try {
        await axiosInstance.put(`/conversations/${selectedUser._id}/clear`);
        setMessages([]);
        toast.success('Chat cleared');
        setIsHeaderMenuOpen(false);
      } catch (error) {
        toast.error('Failed to clear chat');
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await axiosInstance.delete(`/conversations/${selectedUser._id}`);
        toast.success('Conversation deleted');
        useConversationStore.getState().fetchConversations();
        setSelectedUser(null);
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }
    const text = messages.map(msg => {
      const time = new Date(msg.createdAt).toLocaleString();
      const sender = msg.senderId === authUser._id ? 'You' : selectedUser.name;
      const content = msg.image ? '[Image Attached]' : msg.message;
      return `[${time}] ${sender}: ${content}`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WhatsApp_Chat_${selectedUser.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsHeaderMenuOpen(false);
  };

  useEffect(() => {
    if (!messageSearchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const query = messageSearchQuery.toLowerCase();
    const matches = messages.filter(m => m.message && m.message.toLowerCase().includes(query));
    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? matches.length - 1 : 0);
  }, [messageSearchQuery, messages]);

  const scrollToMatch = (index) => {
    if (searchMatches.length === 0) return;
    const msgId = searchMatches[index]._id;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-yellow-200', 'transition-colors', 'duration-500');
      setTimeout(() => el.classList.remove('bg-yellow-200'), 1500);
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = currentMatchIndex < searchMatches.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : searchMatches.length - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] h-full border-b-[6px] border-[#00a884]">
        <div className="text-center px-4 max-w-md">
          {conversations.length === 0 ? (
            <>
              <h1 className="text-3xl font-light text-[#41525d] mb-4 mt-8">Welcome to MERN Chat</h1>
              <p className="text-[#667781] text-[15px] mb-6">Search for a user to start your first conversation.</p>
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="48" height="48" className="text-gray-400" fill="currentColor">
                  <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                </svg>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-light text-[#41525d] mb-4 mt-8">MERN Web</h1>
              <p className="text-[#667781] text-[14px]">Send and receive messages without keeping your phone online.</p>
              <p className="text-[#667781] text-[14px]">Use WhatsApp-style Real-Time Chat on up to 4 linked devices and 1 phone at the same time.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative border-r border-gray-200 min-w-0">
        {/* Header */}
      <div className="bg-[#f0f2f5] p-3 flex items-center justify-between shrink-0 h-16 border-l border-gray-200 z-10">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button onClick={() => setSelectedUser(null)} className="md:hidden text-[#54656f]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
            </svg>
          </button>
          
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-normal text-[16px] text-[#111b21] leading-tight">{selectedUser.name}</span>
            <span className={`text-[13px] ${isTyping ? 'text-[#00a884]' : 'text-[#667781]'} h-4`}>
              {isTyping ? 'typing...' : onlineUsers.includes(selectedUser._id) ? 'online' : (offlineUsers[selectedUser._id] || selectedUser.lastSeen) ? `last seen ${new Date(offlineUsers[selectedUser._id] || selectedUser.lastSeen).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'offline'}
            </span>
          </div>
        </div>
        
        {/* Header Icons */}
        <div className="flex gap-4 text-[#54656f] mr-2 relative">
          <svg onClick={() => setIsMessageSearchOpen(!isMessageSearchOpen)} viewBox="0 0 24 24" width="24" height="24" className="cursor-pointer hover:text-black transition-colors" fill="currentColor">
            <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2-4.6-4.6-4.6z"></path>
          </svg>
          <div ref={menuRef} className="relative">
            <svg onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} viewBox="0 0 24 24" width="24" height="24" className={`cursor-pointer hover:text-black transition-colors ${isHeaderMenuOpen ? 'text-black bg-black/5 rounded-full' : ''}`} fill="currentColor">
              <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
            </svg>
            
            {isHeaderMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white shadow-[0_2px_5px_0_rgba(11,20,26,.26),0_2px_10px_0_rgba(11,20,26,.16)] rounded-[3px] py-2 z-50 animate-fade-in text-[#3b4a54] text-[14.5px]">
                <button onClick={() => { setIsInfoPanelOpen(true); setIsHeaderMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">Contact info</button>
                <button onClick={handleClearChat} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">Clear chat</button>
                <button onClick={handleExportChat} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">Export chat</button>
                <button onClick={handleDeleteConversation} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors text-red-600">Delete chat</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Search Bar */}
      {isMessageSearchOpen && (
        <div className="bg-white p-2 border-b border-gray-200 flex items-center gap-2 shadow-sm z-10 shrink-0">
          <div className="flex-1 bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1">
            <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#54656f]" fill="currentColor">
              <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2-4.6-4.6-4.6z"></path>
            </svg>
            <input 
              type="text"
              autoFocus
              className="w-full bg-transparent border-none focus:outline-none ml-3 text-[15px]"
              placeholder="Search..."
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePrevMatch();
              }}
            />
          </div>
          {searchMatches.length > 0 && (
            <span className="text-[13px] text-[#54656f] mx-2">
              {currentMatchIndex + 1} of {searchMatches.length}
            </span>
          )}
          <div className="flex gap-1">
            <button onClick={handleNextMatch} disabled={searchMatches.length === 0} className="p-2 text-[#54656f] disabled:opacity-30 hover:bg-gray-100 rounded">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 17.5l-6-6 1.4-1.4 4.6 4.6 4.6-4.6 1.4 1.4z"></path></svg>
            </button>
            <button onClick={handlePrevMatch} disabled={searchMatches.length === 0} className="p-2 text-[#54656f] disabled:opacity-30 hover:bg-gray-100 rounded">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 6.5l-6 6 1.4 1.4 4.6-4.6 4.6 4.6 1.4-1.4z"></path></svg>
            </button>
            <button onClick={() => { setIsMessageSearchOpen(false); setMessageSearchQuery(''); }} className="p-2 text-[#54656f] hover:bg-gray-100 rounded ml-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 p-4 overflow-y-auto bg-[#efeae2] relative" 
        onScroll={handleScroll}
        style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px', opacity: 0.9 }}
      >
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <div className="flex justify-center mt-4">
            <span className="bg-[#ffeecd] text-[#54656f] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm text-center">
              Messages and calls are end-to-end encrypted.<br/>No one outside of this chat can read or listen to them.
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === authUser._id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg._id} className={`flex mb-[2px] w-full group ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {/* Reply button for received messages */}
                {!isOwn && (
                  <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-gray-700 mt-1" title="Reply">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                    </svg>
                  </button>
                )}
                
                <div className={`relative max-w-[85%] md:max-w-[65%] min-w-0 px-2 py-1 rounded-lg shadow-sm ${isOwn ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'} ${msg.status === 'scheduled' ? 'opacity-80 border border-dashed border-[#00a884]' : ''}`}>
                  <div className="flex flex-col w-full">
                    
                    {/* Quoted Reply Block */}
                    {msg.replyTo && (
                      <div className="bg-black/5 rounded-[4px] p-2 mb-1 mt-1 border-l-[4px] border-[#02a884] flex flex-col cursor-pointer" 
                           onClick={() => {
                             // Optional: scroll to original message
                             const originalMsgEl = document.getElementById(`msg-${msg.replyTo._id}`);
                             if (originalMsgEl) originalMsgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                           }}>
                        <span className="text-[#02a884] text-[12.5px] font-medium leading-none mb-1">
                          {msg.replyTo.senderId === authUser._id ? 'You' : selectedUser.name}
                        </span>
                        <span className="text-[#667781] text-[13px] leading-[18px] line-clamp-3 overflow-hidden text-ellipsis break-words">
                          {msg.replyTo.message}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-end justify-between mt-[2px]">
                      <div className="flex flex-col w-full max-w-full">
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attached file" 
                            className="rounded-lg mb-1 max-w-full cursor-pointer hover:opacity-95 transition-opacity bg-black/5" 
                            style={{ maxHeight: '250px', objectFit: 'contain' }}
                            onClick={() => setFullScreenImage(msg.image)}
                          />
                        )}
                        {msg.message && (
                          <span 
                            className="text-[14.2px] text-[#111b21] break-words whitespace-pre-wrap leading-[19px] max-w-full rounded"
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            id={`msg-${msg._id}`}
                          >
                            {msg.message}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-[2px] text-[11px] text-[#667781] shrink-0 ml-auto pl-3 pb-[1px]">
                        <span className="leading-none pt-[2px]">{time}</span>
                        {isOwn && (
                          msg.status === 'scheduled' ? (
                            <span className="text-gray-400 leading-none pt-[2px] flex items-center">
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 11V6h1.5v4.4l4.5 4.5-.8.9z"></path>
                              </svg>
                            </span>
                          ) : msg.status === 'read' ? (
                            <span className="text-[#53bdeb] font-bold tracking-tighter leading-none pt-[2px]">✓✓</span>
                          ) : msg.status === 'delivered' ? (
                            <span className="text-gray-400 font-bold tracking-tighter leading-none pt-[2px]">✓✓</span>
                          ) : (
                            <span className="text-gray-400 leading-none pt-[2px]">✓</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply button for sent messages */}
                {isOwn && (
                  <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-gray-700 mt-1" title="Reply">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Scroll to bottom button */}
      {!isUserNearBottom && (
        <button
          onClick={() => {
            setIsUserNearBottom(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute right-4 bottom-[80px] bg-white text-[#54656f] p-2 rounded-full shadow-lg hover:bg-[#f0f2f5] transition-colors z-20 border border-gray-200"
          title="Scroll to bottom"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 17.5l-6-6 1.4-1.4 4.6 4.6 4.6-4.6 1.4 1.4z"></path>
          </svg>
        </button>
      )}

      {/* Input Area */}
      <div className="flex flex-col z-10 shrink-0 border-l border-gray-200">
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-[#f0f2f5] px-4 pt-2 flex items-center relative">
            <div className="relative inline-block mt-2 mb-1">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border border-gray-300 shadow-sm" />
              <button 
                type="button" 
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-gray-600/80 hover:bg-gray-800 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center transition-colors"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-[#f0f2f5] px-4 pt-2 flex items-center relative">
            <div className="bg-black/5 rounded-[4px] p-2 border-l-[4px] border-[#02a884] flex-1 flex items-start justify-between">
              <div className="flex flex-col w-full">
                <span className="text-[#02a884] text-[12.5px] font-medium leading-none mb-1">
                  {replyingTo.senderId === authUser._id ? 'You' : selectedUser.name}
                </span>
                <span className="text-[#667781] text-[13px] leading-[18px] line-clamp-1 overflow-hidden text-ellipsis break-words">
                  {replyingTo.message}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setReplyingTo(null)}
                className="text-[#54656f] hover:text-black ml-4 shrink-0 transition-colors"
                title="Cancel reply"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.1 17.7l-1.4 1.4L12 13.4l-5.7 5.7-1.4-1.4L10.6 12 4.9 6.3l1.4-1.4L12 10.6l5.7-5.7 1.4 1.4L13.4 12z"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Schedule date/time picker */}
        {isScheduling && (
          <div className="bg-[#f0f2f5] px-4 pt-2 pb-0 flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="18" height="18" className="text-[#00a884] shrink-0" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 11V6h1.5v4.4l4.5 4.5-.8.9z"></path>
            </svg>
            <input
              type="datetime-local"
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none text-[#111b21] focus:border-[#00a884] transition-colors"
              value={scheduleDate}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => { setIsScheduling(false); setScheduleDate(''); }}
              className="text-[#54656f] hover:text-black transition-colors shrink-0"
              title="Cancel scheduling"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19.1 17.7l-1.4 1.4L12 13.4l-5.7 5.7-1.4-1.4L10.6 12 4.9 6.3l1.4-1.4L12 10.6l5.7-5.7 1.4 1.4L13.4 12z"></path>
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3">
          <svg viewBox="0 0 24 24" width="26" height="26" className="text-[#54656f] cursor-pointer shrink-0 hidden md:block" fill="currentColor">
            <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.379 0-4.782-1.685-5.021-1.936l1.241-.45c.168.214 1.25.922 3.78.922 2.41 0 3.651-.837 3.864-1.002l1.187.507zm-2.023-4.432c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path>
          </svg>
          <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#54656f] hover:text-[#00a884] transition-colors p-1" title="Attach image">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M21.58 4.37H2.42C1.09 4.37 0 5.46 0 6.79v10.42c0 1.33 1.09 2.42 2.42 2.42h19.16c1.33 0 2.42-1.09 2.42-2.42V6.79c0-1.33-1.09-2.42-2.42-2.42zm-1.8 11.04H4.22c-.66 0-1.2-.54-1.2-1.2V8.79c0-.66.54-1.2 1.2-1.2h15.56c.66 0 1.2.54 1.2 1.2v5.42c0 .66-.54 1.2-1.2 1.2zm-12-6.52a2.42 2.42 0 1 0 0 4.84 2.42 2.42 0 0 0 0-4.84zm11 4.58l-3.32-3.32c-.31-.31-.82-.31-1.13 0l-1.8 1.8-1.58-1.58c-.31-.31-.82-.31-1.13 0l-3.23 3.23c-.31.31-.31.82 0 1.13.16.16.36.23.57.23s.41-.08.57-.23l2.67-2.67 1.58 1.58c.31.31.82.31 1.13 0l1.24-1.24 2.76 2.76c.16.16.36.23.57.23s.41-.08.57-.23c.32-.31.32-.82 0-1.13z"></path>
            </svg>
          </button>
          <svg viewBox="0 0 24 24" width="26" height="26" className="text-[#54656f] cursor-pointer shrink-0" fill="currentColor">
            <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.264.123-.624-.131-.877l-.242-.242c-.227-.227-.557-.3-.811-.115l-7.203 7.205c-1.422 1.423-2.205 3.313-2.205 5.32z"></path>
          </svg>
          <input
            type="text"
            className="flex-1 bg-white border-none rounded-lg px-4 py-[9px] text-[15px] focus:outline-none placeholder-[#8696a0]"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.trim().length > 0) handleTyping();
              else stopTyping();
            }}
          />
          {/* Schedule toggle button */}
          <button
            type="button"
            onClick={() => setIsScheduling(prev => !prev)}
            className={`p-1 transition-colors shrink-0 ${isScheduling ? 'text-[#00a884]' : 'text-[#54656f] hover:text-[#00a884]'}`}
            title={isScheduling ? 'Cancel scheduling' : 'Schedule message'}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 11V6h1.5v4.4l4.5 4.5-.8.9z"></path>
            </svg>
          </button>

          {newMessage.trim().length > 0 || selectedImage ? (
            <button
              type="submit"
              disabled={isSending || (isScheduling && !scheduleDate)}
              className={`p-1 transition-colors shrink-0 ${isSending || (isScheduling && !scheduleDate) ? 'text-gray-300 cursor-not-allowed' : 'text-[#54656f] hover:text-[#00a884]'}`}
              title={isScheduling ? 'Send scheduled message' : 'Send'}
            >
              {isSending ? (
                <Spinner />
              ) : isScheduling ? (
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 3l5 3.5L13 14l-5-3.5L13 7zm0 7l-6-4.2V17h12v-7.2L13 14z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                  <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                </svg>
              )}
            </button>
          ) : (
            <button type="button" className="text-[#54656f] hover:text-[#00a884] p-1 transition-colors shrink-0">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path>
              </svg>
            </button>
          )}
        </form>
      </div>
      
      {/* Image Full Screen Modal */}
      {fullScreenImage && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
          <button 
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 transition-colors bg-black/20 rounded-full"
            title="Close"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M19.1 17.7l-1.4 1.4L12 13.4l-5.7 5.7-1.4-1.4L10.6 12 4.9 6.3l1.4-1.4L12 10.6l5.7-5.7 1.4 1.4L13.4 12z"></path>
            </svg>
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full screen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" 
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image
          />
        </div>
      )}
      </div>
      
      {/* Right Info Panel */}
      {isInfoPanelOpen && (
        <div className="w-[350px] shrink-0 bg-[#f0f2f5] flex flex-col h-full overflow-y-auto animate-slide-in border-l border-gray-200">
          <div className="h-16 flex items-center px-6 shrink-0 bg-white">
            <button onClick={() => setIsInfoPanelOpen(false)} className="mr-6 text-[#54656f]">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
              </svg>
            </button>
            <span className="text-[16px] font-medium text-[#111b21]">Contact info</span>
          </div>
          
          <div className="bg-white flex flex-col items-center py-8 px-4 shadow-sm mb-2">
            <div className="w-[200px] h-[200px] bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-6xl font-bold mb-5 shadow-sm">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-[22px] text-[#111b21] mb-1">{selectedUser.name}</h2>
            <span className="text-[16px] text-[#667781] mb-1">
              {selectedUser.email}
            </span>
            <span className={`text-[14px] ${onlineUsers.includes(selectedUser._id) ? 'text-[#00a884]' : 'text-[#667781]'}`}>
              {onlineUsers.includes(selectedUser._id) ? 'Online' : (offlineUsers[selectedUser._id] || selectedUser.lastSeen) ? `Last seen ${new Date(offlineUsers[selectedUser._id] || selectedUser.lastSeen).toLocaleString()}` : 'Offline'}
            </span>
          </div>

          <div className="bg-white px-7 py-4 shadow-sm mb-2">
            <span className="text-[14px] text-[#00a884] mb-2 block font-medium">About</span>
            <span className="text-[16px] text-[#111b21]">{selectedUser.about || 'Hey there! I am using MERN Chat.'}</span>
          </div>

          <div className="bg-white px-7 py-4 shadow-sm mb-2">
            <span className="text-[14px] text-[#00a884] mb-2 block font-medium">Chat details</span>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#111b21]">Total messages</span>
                <span className="text-[14px] text-[#667781]">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#111b21]">Media shared</span>
                <span className="text-[14px] text-[#667781]">{messages.filter(m => m.image).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-[#111b21]">Joined date</span>
                <span className="text-[14px] text-[#667781]">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
