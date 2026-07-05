import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const MainLayout = () => {
  const { authUser, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">Real-Time Chat</Link>
          
          <nav>
            {authUser ? (
              <div className="flex items-center gap-4">
                <Link to="/chat" className="font-medium text-blue-600 hover:underline">Messages</Link>
                <span className="font-medium text-gray-700 hidden sm:block">Hello, {authUser.name}</span>
                <button 
                  onClick={logout}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md font-medium text-sm transition">Log In</Link>
                <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
      
      <footer className="bg-white p-4 text-center text-sm text-gray-500 border-t">
        &copy; {new Date().getFullYear()} MERN Chat Application
      </footer>
    </div>
  );
};

export default MainLayout;
