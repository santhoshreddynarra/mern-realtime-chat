import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/Sidebar';
import MessageContainer from '../components/MessageContainer';

const Chat = () => {
  const { authUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);

  if (!authUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-[80vh] flex rounded-lg shadow-sm border overflow-hidden bg-white">
      <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      <MessageContainer selectedUser={selectedUser} />
    </div>
  );
};

export default Chat;
