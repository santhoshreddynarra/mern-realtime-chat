import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const ProfileSidebar = ({ isOpen, onClose }) => {
  const { authUser, setAuthUser } = useAuthStore();
  const [name, setName] = useState(authUser?.name || '');
  const [about, setAbout] = useState(authUser?.about || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setName(authUser.name);
      setAbout(authUser.about || 'Hey there! I am using MERN Chat.');
    }
  }, [authUser]);

  const handleSave = async () => {
    if (!name.trim()) {
      return toast.error("Name cannot be empty");
    }
    setLoading(true);
    try {
      const res = await axiosInstance.put('/users/profile', { name, about });
      setAuthUser(res.data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`absolute top-0 left-0 h-full w-full bg-[#f0f2f5] z-30 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="bg-[#008069] text-white flex items-center h-28 px-4 pb-4 pt-12 shrink-0">
        <button onClick={onClose} className="mr-6 hover:bg-black/10 p-2 rounded-full transition-colors">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar Section */}
        <div className="bg-[#f0f2f5] py-7 flex justify-center">
          <div className="relative group cursor-pointer w-[200px] h-[200px] rounded-full overflow-hidden bg-blue-100 flex justify-center items-center">
            {authUser?.profilePic ? (
              <img src={authUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl text-blue-600 font-bold">{name.charAt(0).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="mb-2">
                <path d="M21.2 5.8h-3.4l-1-2.4H7.2l-1 2.4H2.8C1.8 5.8 1 6.6 1 7.6v12c0 1 .8 1.8 1.8 1.8h18.4c1 0 1.8-.8 1.8-1.8v-12c0-1-.8-1.8-1.8-1.8zM12 18.2c-3 0-5.4-2.4-5.4-5.4s2.4-5.4 5.4-5.4 5.4 2.4 5.4 5.4-2.4 5.4-5.4 5.4zM12 9c-1.9 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6-1.6-3.6-3.6-3.6z"></path>
              </svg>
              <span className="text-[13px] uppercase tracking-wider text-center px-4 leading-tight">Change<br/>Profile Photo</span>
            </div>
          </div>
        </div>

        {/* Name Section */}
        <div className="bg-white px-7 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-2">
          <p className="text-[#008069] text-[14px] mb-4">Your name</p>
          <div className="flex items-center border-b-2 border-transparent focus-within:border-[#008069] pb-1 transition-colors">
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[17px] text-[#3b4a54] outline-none"
            />
          </div>
          <p className="text-[#667781] text-[13px] mt-4">
            This is not your username or pin. This name will be visible to your WhatsApp contacts.
          </p>
        </div>

        {/* About Section */}
        <div className="bg-white px-7 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-[#008069] text-[14px] mb-4">About</p>
          <div className="flex items-center border-b-2 border-transparent focus-within:border-[#008069] pb-1 transition-colors">
            <input 
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full text-[17px] text-[#3b4a54] outline-none"
            />
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-center mt-6 mb-6">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#008069] text-white px-6 py-2 rounded-full font-medium hover:bg-[#01705c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
