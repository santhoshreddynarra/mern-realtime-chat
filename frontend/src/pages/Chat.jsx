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
    <div className="h-screen w-full flex overflow-hidden bg-[#f0f2f5]">
      {/* Sidebar - hidden on mobile if a user is selected */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-[35%] lg:w-[30%] max-w-[420px] border-r bg-white flex-col h-full shadow-sm z-10`}>
        <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      </div>
      
      {/* Chat Area - hidden on mobile if no user is selected */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-[#efeae2] relative`}>
        <MessageContainer selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
      </div>
    </div>
  );
};

export default Chat;
