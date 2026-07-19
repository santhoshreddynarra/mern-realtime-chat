import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';

const SettingsSidebar = ({ isOpen, onClose }) => {
  const { theme, toggleTheme: toggleDarkMode } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('whatsapp_settings')) || {};
    setNotifications(settings.notifications !== undefined ? settings.notifications : true);
    setSounds(settings.sounds !== undefined ? settings.sounds : true);
    setAutoDownload(settings.autoDownload !== undefined ? settings.autoDownload : false);
  }, []);

  const saveSettings = (newSettings) => {
    localStorage.setItem('whatsapp_settings', JSON.stringify(newSettings));
  };

  const toggleSetting = (setting) => {
    if (setting === 'darkMode') {
      toggleDarkMode();
      toast.success(theme === 'light' ? 'Dark mode enabled' : 'Dark mode disabled');
      return;
    }
    
    const currentState = { notifications, sounds, autoDownload };
    currentState[setting] = !currentState[setting];
    
    switch (setting) {
      case 'notifications': setNotifications(currentState.notifications); break;
      case 'sounds': setSounds(currentState.sounds); break;
      case 'autoDownload': setAutoDownload(currentState.autoDownload); break;
      default: break;
    }
    
    saveSettings(currentState);
  };

  return (
    <div className={`absolute top-0 left-0 h-full w-full bg-[#f0f2f5] dark:bg-gray-900 z-30 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="bg-[#008069] text-white flex items-center h-28 px-4 pb-4 pt-12 shrink-0">
        <button onClick={onClose} className="mr-6 hover:bg-black/10 p-2 rounded-full transition-colors">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-gray-900">
        
        {/* Toggle List */}
        <div className="bg-white dark:bg-gray-800 mt-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSetting('darkMode')}
          >
            <div>
              <p className="text-[16px] text-[#3b4a54] dark:text-gray-100">Dark Mode</p>
              <p className="text-[13px] text-[#667781] dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <div className={`w-10 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#00a884]' : 'bg-gray-300'}`}>
              <div className={`absolute top-[-3px] w-5 h-5 rounded-full shadow-md bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>
          
          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSetting('notifications')}
          >
            <div>
              <p className="text-[16px] text-[#3b4a54] dark:text-gray-100">Notifications</p>
              <p className="text-[13px] text-[#667781] dark:text-gray-400">Show message previews and alerts</p>
            </div>
            <div className={`w-10 h-4 rounded-full relative transition-colors ${notifications ? 'bg-[#00a884]' : 'bg-gray-300'}`}>
              <div className={`absolute top-[-3px] w-5 h-5 rounded-full shadow-md bg-white transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSetting('sounds')}
          >
            <div>
              <p className="text-[16px] text-[#3b4a54] dark:text-gray-100">Sounds</p>
              <p className="text-[13px] text-[#667781] dark:text-gray-400">Play sounds for incoming messages</p>
            </div>
            <div className={`w-10 h-4 rounded-full relative transition-colors ${sounds ? 'bg-[#00a884]' : 'bg-gray-300'}`}>
              <div className={`absolute top-[-3px] w-5 h-5 rounded-full shadow-md bg-white transition-transform ${sounds ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSetting('autoDownload')}
          >
            <div>
              <p className="text-[16px] text-[#3b4a54] dark:text-gray-100">Auto-download Media</p>
              <p className="text-[13px] text-[#667781] dark:text-gray-400">Automatically download incoming images</p>
            </div>
            <div className={`w-10 h-4 rounded-full relative transition-colors ${autoDownload ? 'bg-[#00a884]' : 'bg-gray-300'}`}>
              <div className={`absolute top-[-3px] w-5 h-5 rounded-full shadow-md bg-white transition-transform ${autoDownload ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;
