import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useSocketStore } from '../store/useSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocketStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get('/users');
        setUsers(res.data);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-full bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#f0f2f5] p-3 flex items-center justify-between shrink-0 h-16 border-r border-gray-200">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold overflow-hidden cursor-pointer">
          {authUser?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex gap-4 text-[#54656f]">
          {/* Status icon placeholder */}
          <svg viewBox="0 0 24 24" width="24" height="24" className="cursor-pointer" fill="currentColor">
            <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-3.092a.977.977 0 0 1-.962-1.156A7.472 7.472 0 1 0 5.038 16.41a.977.977 0 0 1-1.156.962A9.418 9.418 0 1 1 19.965 17.57z"></path>
          </svg>
          {/* New chat icon placeholder */}
          <svg viewBox="0 0 24 24" width="24" height="24" className="cursor-pointer" fill="currentColor">
            <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path>
          </svg>
          {/* Menu icon placeholder */}
          <svg viewBox="0 0 24 24" width="24" height="24" className="cursor-pointer" fill="currentColor">
            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
          </svg>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-2 border-b border-gray-200 shrink-0">
        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
          <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#54656f] mr-3" fill="currentColor">
            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
          </svg>
          <input type="text" placeholder="Search or start new chat" className="bg-transparent border-none focus:outline-none w-full text-[15px] placeholder-[#8696a0]" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {loading ? (
          <Spinner />
        ) : (
          users.map((user) => {
            const isOnline = onlineUsers.includes(user._id);

            return (
              <div 
                key={user._id} 
                onClick={() => setSelectedUser(user)}
                className={`flex items-center px-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors ${selectedUser?._id === user._id ? 'bg-[#f0f2f5]' : ''}`}
              >
                <div className="relative mr-3 shrink-0 py-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 border-b border-gray-100 h-full py-3 pr-2 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h2 className="font-normal text-[17px] text-[#111b21] truncate leading-none">{user.name}</h2>
                    <span className={`text-[12px] ${isOnline ? 'text-[#00a884]' : 'text-gray-400'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] text-[#667781] truncate leading-tight">
                      Tap to view conversation
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
