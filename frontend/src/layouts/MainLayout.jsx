import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const MainLayout = () => {
  const { authUser, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 transition-colors">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">Real-Time Chat</Link>
          
          <nav>
            {authUser ? (
              <div className="flex items-center gap-4">
                <Link to="/chat" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Messages</Link>
                <span className="font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Hello, {authUser.name}</span>
                <button 
                  onClick={logout}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md font-medium text-sm transition">Log In</Link>
                <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition font-medium text-sm">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
      
      <footer className="bg-white dark:bg-gray-800 p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 transition-colors">
        &copy; {new Date().getFullYear()} MERN Chat Application
      </footer>
    </div>
  );
};

export default MainLayout;
