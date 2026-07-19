import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Home = () => {
  const [health, setHealth] = useState('Checking server...');
  const { authUser } = useAuthStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await axiosInstance.get('/health');
        setHealth(data.message);
      } catch (error) {
        setHealth('Server is down or unreachable.');
      }
    };
    checkHealth();
  }, []);

  if (authUser) return <Navigate to="/chat" />;

  return (
    <div className="flex flex-col items-center justify-center h-full mt-20">
      <h2 className="text-3xl font-bold mb-4 dark:text-gray-100">Welcome to the App</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Initialization is complete.</p>
      
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg border dark:border-gray-700 transition-colors">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Backend Connection Status:</h3>
        <p className={`font-medium ${health === 'Server is healthy' ? 'text-green-600' : 'text-red-500'}`}>
          {health}
        </p>
      </div>
    </div>
  );
};

export default Home;
