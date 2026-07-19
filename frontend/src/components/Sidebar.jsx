import { useEffect, useState, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useConversationStore } from '../store/useConversationStore';
import Spinner from './Spinner';
import NewChatSidebar from './NewChatSidebar';
import ProfileSidebar from './ProfileSidebar';
import SettingsSidebar from './SettingsSidebar';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState('all'); // all, unread, online, archived
  const [searchQuery, setSearchQuery] = useState('');
  
  const filterMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  const { onlineUsers } = useSocketStore();
  const { authUser, setAuthUser } = useAuthStore();
  const { conversations, loading, fetchConversations } = useConversationStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      useSocketStore.getState().disconnectSocket();
      useConversationStore.getState().conversations = [];
      setAuthUser(null);
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter(user => {
    if (user._id === authUser?._id) return false; // Exclude current user
    
    // Apply type filter
    if (chatFilter === 'unread' && (!user.unreadCount || user.unreadCount === 0)) return false;
    if (chatFilter === 'online' && !onlineUsers.includes(user._id)) return false;
    if (chatFilter === 'archived') return false; // placeholder

    // Apply text search
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return user.name?.toLowerCase().includes(term) || user.username?.toLowerCase().includes(term);
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if within the last 7 days
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    
    // Older messages
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="w-full bg-white flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="bg-[#f0f2f5] p-3 flex items-center justify-between shrink-0 h-16 border-r border-gray-200">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold overflow-hidden cursor-pointer" title={authUser?.name}>
          {authUser?.name?.charAt(0)?.toUpperCase() || ''}
        </div>
        <div className="flex gap-4 text-[#54656f]">
          <div ref={filterMenuRef} className="relative">
            <svg onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} viewBox="0 0 24 24" width="24" height="24" className={`cursor-pointer hover:text-black transition-colors ${isFilterMenuOpen || chatFilter !== 'all' ? 'text-black bg-black/5 rounded-full' : ''}`} fill="currentColor">
              <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-3.092a.977.977 0 0 1-.962-1.156A7.472 7.472 0 1 0 5.038 16.41a.977.977 0 0 1-1.156.962A9.418 9.418 0 1 1 19.965 17.57z"></path>
            </svg>
            {isFilterMenuOpen && (
              <div className="absolute left-0 top-10 w-48 bg-white shadow-[0_2px_5px_0_rgba(11,20,26,.26),0_2px_10px_0_rgba(11,20,26,.16)] rounded-[3px] py-2 z-50 animate-fade-in text-[#3b4a54] text-[14.5px]">
                <button onClick={() => { setChatFilter('all'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors ${chatFilter === 'all' ? 'font-medium text-[#00a884]' : ''}`}>All Chats</button>
                <button onClick={() => { setChatFilter('unread'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors ${chatFilter === 'unread' ? 'font-medium text-[#00a884]' : ''}`}>Unread Chats</button>
                <button onClick={() => { setChatFilter('online'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors ${chatFilter === 'online' ? 'font-medium text-[#00a884]' : ''}`}>Online Users</button>
                <button onClick={() => { setChatFilter('archived'); setIsFilterMenuOpen(false); toast.success('Archived feature coming soon'); }} className={`w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors ${chatFilter === 'archived' ? 'font-medium text-[#00a884]' : ''}`}>Archived</button>
              </div>
            )}
          </div>
          
          <svg onClick={() => setIsNewChatOpen(true)} viewBox="0 0 24 24" width="24" height="24" className="cursor-pointer hover:text-black transition-colors" fill="currentColor">
            <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path>
          </svg>

          <div ref={moreMenuRef} className="relative">
            <svg onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} viewBox="0 0 24 24" width="24" height="24" className={`cursor-pointer hover:text-black transition-colors ${isMoreMenuOpen ? 'text-black bg-black/5 rounded-full' : ''}`} fill="currentColor">
              <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
            </svg>
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white shadow-[0_2px_5px_0_rgba(11,20,26,.26),0_2px_10px_0_rgba(11,20,26,.16)] rounded-[3px] py-2 z-50 animate-fade-in text-[#3b4a54] text-[14.5px]">
                <button onClick={() => { setIsProfileOpen(true); setIsMoreMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">Profile</button>
                <button onClick={() => { setIsSettingsOpen(true); setIsMoreMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">Settings</button>
                <button onClick={() => { toast('This feature will be added in a future update', { icon: 'ℹ️' }); setIsMoreMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors">New Group</button>
                <button onClick={handleLogout} className="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] transition-colors text-red-600">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-2 border-b border-gray-200 shrink-0">
        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
          <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#54656f] mr-3" fill="currentColor">
            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            className="bg-transparent border-none focus:outline-none w-full text-[15px] placeholder-[#8696a0]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {loading ? (
          <Spinner />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10">
            <div className="w-24 h-24 bg-[#f0f2f5] rounded-full flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" width="48" height="48" className="text-[#00a884]" fill="currentColor">
                <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path>
              </svg>
            </div>
            <h3 className="text-[#111b21] text-lg font-medium mb-2">Start your first conversation</h3>
            <p className="text-[#667781] text-[14px] mb-6 max-w-[250px]">Connect with other registered users and start chatting right away.</p>
            <button 
              onClick={() => setIsNewChatOpen(true)}
              className="bg-[#00a884] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#008f6f] transition-colors shadow-sm"
            >
              New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;

            return (
              <div 
                key={user._id} 
                onClick={() => {
                  setSelectedUser(user);
                }}
                className={`flex items-center px-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors ${isSelected ? 'bg-[#f0f2f5]' : ''}`}
              >
                <div className="relative mr-3 shrink-0 py-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {user.name?.charAt(0)?.toUpperCase() || ''}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-3 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 border-b border-gray-100 h-full py-3 pr-2 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h2 className="font-normal text-[17px] text-[#111b21] truncate leading-none">{user.name}</h2>
                    <span className="text-[12px] text-[#667781] shrink-0 ml-2">
                      {formatTime(user.lastMessageAt || user.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[14px] truncate leading-tight ${user.lastMessage ? 'text-[#667781]' : 'text-gray-400 italic'}`}>
                      {user.lastMessage ? (
                        <>
                          {user.lastMessageSenderId === authUser?._id && <span>You: </span>}
                          {user.lastMessage}
                        </>
                      ) : (
                        'Start chatting...'
                      )}
                    </p>
                    {user.unreadCount > 0 && (
                      <div className="bg-[#25d366] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{user.unreadCount}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Slide-over New Chat Panel */}
      <NewChatSidebar 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        setSelectedUser={setSelectedUser}
      />
      
      {/* Slide-over Profile Panel */}
      <ProfileSidebar 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      {/* Slide-over Settings Panel */}
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default Sidebar;
