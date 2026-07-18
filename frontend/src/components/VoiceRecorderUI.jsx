import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Send, Square } from 'lucide-react';

const VoiceRecorderUI = ({
  isRecording,
  recordingTime,
  formattedTime,
  audioBlob,
  onStart,
  onStop,
  onCancel,
  onSend
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  
  useEffect(() => {
    if (audioBlob && !audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current.duration) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };
  }, [audioBlob]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = x / rect.width;
    
    audioRef.current.currentTime = clickedValue * audioRef.current.duration;
    setProgress(clickedValue * 100);
  };

  if (audioBlob) {
    // Preview Mode
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
        <button onClick={onCancel} className="text-gray-500 hover:text-red-500 transition-colors p-2" title="Delete recording">
          <Trash2 size={20} />
        </button>
        
        <div className="flex-1 flex items-center gap-3 mx-4">
          <button onClick={togglePlayback} className="text-[#00a884] p-2 bg-[#d9fdd3] rounded-full hover:bg-[#c3f0bb] transition-colors">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-[2px]" />}
          </button>
          
          <div className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden" onClick={handleSeek}>
            <div className="h-full bg-[#00a884] rounded-full" style={{ width: `${progress}%` }} />
          </div>
          
          <span className="text-xs text-gray-500 min-w-[35px]">{formattedTime}</span>
        </div>
        
        <button onClick={() => onSend(audioBlob, recordingTime)} className="text-white bg-[#00a884] hover:bg-[#018e6f] p-2 rounded-full transition-colors" title="Send voice message">
          <Send size={18} className="ml-[2px] mt-[1px]" />
        </button>
      </div>
    );
  }

  if (isRecording) {
    // Recording Mode
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-[9px] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[15px] font-medium text-gray-700 w-12">{formattedTime}</span>
        </div>
        
        {/* Simple animated waveform visualization */}
        <div className="flex items-center gap-[3px] flex-1 justify-center px-4 overflow-hidden h-6 opacity-70">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-[#00a884] rounded-full"
              style={{
                height: `${Math.max(20, Math.random() * 100)}%`,
                animation: `pulse ${0.5 + Math.random() * 0.5}s infinite alternate`
              }}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={onCancel} className="text-gray-500 hover:text-red-500 transition-colors p-2" title="Cancel recording">
            <Trash2 size={20} />
          </button>
          <button onClick={onStop} className="text-[#00a884] bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors ml-1" title="Stop recording">
            <Square size={16} fill="currentColor" className="text-red-500" />
          </button>
        </div>
      </div>
    );
  }

  // Not recording fallback (should rarely be rendered directly, usually managed by parent)
  return null;
};

export default VoiceRecorderUI;
