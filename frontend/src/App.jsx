import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useSocketStore } from './store/useSocketStore';

const App = () => {
  const { authUser } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    if (authUser) {
      connectSocket(authUser._id);
    } else {
      disconnectSocket();
    }
  }, [authUser, connectSocket, disconnectSocket]);

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>
        <Route path="/chat" element={<Chat />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  );
};

export default App;
