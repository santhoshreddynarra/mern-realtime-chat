import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download } from 'lucide-react';

const VoiceMessageBubble = ({ msg, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  const duration = msg.audioDuration || 0;

  useEffect(() => {
    if (msg.audio && !audioRef.current) {
      audioRef.current = new Audio(msg.audio);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current.duration) {
          setCurrentTime(audioRef.current.currentTime);
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [msg.audio]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = x / rect.width;
    
    // Fallback to msg.audioDuration if browser hasn't loaded duration yet
    const totalDuration = audioRef.current.duration && isFinite(audioRef.current.duration) 
      ? audioRef.current.duration 
      : duration;
      
    if (totalDuration) {
      audioRef.current.currentTime = clickedValue * totalDuration;
      setProgress(clickedValue * 100);
      setCurrentTime(clickedValue * totalDuration);
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayTime = isPlaying || progress > 0 ? currentTime : duration;

  return (
    <div className={`flex items-center gap-2 p-1 min-w-[200px] sm:min-w-[240px]`}>
      <button 
        onClick={togglePlayback} 
        className="shrink-0 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm"
        style={{ backgroundColor: isOwn ? '#11967e' : '#00a884' }}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-[2px]" />}
      </button>
      
      <div className="flex-1 flex flex-col gap-1 ml-1 w-full relative">
        <div className="flex items-center gap-2 w-full pt-1">
          {/* Simple waveform / progress bar */}
          <div className="flex-1 h-3 bg-black/10 rounded-full cursor-pointer relative overflow-hidden" onClick={handleSeek}>
            <div 
              className="h-full rounded-full transition-all duration-100 ease-linear" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: isOwn ? '#02a884' : '#00a884'
              }} 
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
          <span className={isOwn ? 'text-gray-600' : 'text-gray-500'}>
            {formatTime(displayTime)}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={cycleSpeed} className="px-1 py-0.5 rounded hover:bg-black/5 text-[10px] font-bold">
              {playbackSpeed}x
            </button>
            <a href={msg.audio} target="_blank" rel="noopener noreferrer" download className="text-gray-400 hover:text-gray-600" title="Download">
              <Download size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize to avoid unnecessary re-renders when other messages update
export default React.memo(VoiceMessageBubble);
