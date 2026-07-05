import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useSocketStore } from '../store/useSocketStore';
import toast from 'react-hot-toast';

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocketStore();

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
    <div className="w-1/3 bg-white border-r flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b font-semibold text-gray-700 sticky top-0 bg-white">
        Contacts
      </div>
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      ) : (
        users.map((user) => {
          const isOnline = onlineUsers.includes(user._id);

          return (
            <div 
              key={user._id} 
              onClick={() => setSelectedUser(user)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition ${selectedUser?._id === user._id ? 'bg-blue-50' : ''}`}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.name}</p>
                <p className={`text-xs truncate ${isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Sidebar;
