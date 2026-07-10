import { useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import Spinner from './Spinner';
import { useConversationStore } from '../store/useConversationStore';

const NewChatSidebar = ({ isOpen, onClose, setSelectedUser }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { createConversation } = useConversationStore();

  const debounceTimeout = useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/users/search?q=${query}`);
        setResults(res.data);
      } catch (error) {
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleUserSelect = async (user) => {
    await createConversation(user);
    setSelectedUser(user);
    onClose();
  };

  return (
    <div className={`absolute top-0 left-0 h-full w-full bg-white z-20 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="bg-[#008069] text-white flex items-center h-28 px-4 pb-4 pt-12 shrink-0">
        <button onClick={onClose} className="mr-6 hover:bg-black/10 p-2 rounded-full transition-colors">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
          </svg>
        </button>
        <h1 className="text-xl font-semibold">New chat</h1>
      </div>

      {/* Search Input */}
      <div className="bg-white p-2 border-b border-gray-200 shrink-0">
        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
          <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#54656f] mr-3" fill="currentColor">
            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Search name or number" 
            className="bg-transparent border-none focus:outline-none w-full text-[15px] placeholder-[#8696a0]"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4"><Spinner /></div>
        ) : search.length > 0 && results.length === 0 ? (
          <div className="text-center text-[#667781] p-6 text-sm">No contacts found</div>
        ) : (
          results.map((user) => (
            <div 
              key={user._id} 
              onClick={() => handleUserSelect(user)}
              className="flex items-center px-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors group"
            >
              <div className="relative mr-3 shrink-0 py-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 border-b border-gray-100 h-full py-3 pr-2 flex flex-col justify-center">
                <h2 className="font-normal text-[17px] text-[#111b21] truncate">{user.name}</h2>
                <div className="flex text-[13px] text-[#667781] gap-2 mt-0.5">
                  <span className="truncate max-w-[50%]">@{user.username || 'user'}</span>
                  {user.phone && <span className="truncate">{user.phone}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewChatSidebar;
