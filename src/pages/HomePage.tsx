import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodSphere } from '../components/MoodSphere';
import { MoodSlider } from '../components/MoodSlider';
import { useMoodStore } from '../store/useMoodStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore, AudioMode } from '../store/useSettingsStore';
import { PenLine, X, Check, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from '../components/UserMenu';

// Helper function to get audio URL
const getAudioUrl = (score: number, mode: AudioMode): string => {
  let level = Math.floor(score / 10);
  if (score >= 96) level = 10;
  else if (score >= 90) level = 9;
  return `/audio/${mode}/level_${level}.mp3`;
};

export const HomePage = () => {
  const { 
    currentScore, 
    setCurrentScore, 
    lastVisitDate, 
    setTodayBaseline, 
    addRecord 
  } = useMoodStore();

  const { user, initAuth, logout } = useAuthStore();
  const { isAudioEnabled, audioMode } = useSettingsStore();
  
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordNote, setRecordNote] = useState('');
  const [recordScore, setRecordScore] = useState(currentScore);
  
  // Local state for "Wake Up" flow
  const [isWakeUp, setIsWakeUp] = useState(false);
  const [wakeUpScore, setWakeUpScore] = useState(50);

  // Debug State
  const [lastAudioError, setLastAudioError] = useState<string>('');

  // Native Audio Ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Calculate active audio source based on current mode and score
  const activeAudioSrc = useMemo(() => {
    if (!isAudioEnabled) return undefined;
    
    // Determine which score to use
    // If in wake up mode, use wakeUpScore
    // If recording, use recordScore
    // Otherwise fallback to currentScore (though not typically playing then)
    const targetScore = isWakeUp ? wakeUpScore : (isRecording ? recordScore : currentScore);
    
    return getAudioUrl(targetScore, audioMode);
  }, [isAudioEnabled, audioMode, isWakeUp, wakeUpScore, isRecording, recordScore, currentScore]);

  // Force load when source changes (Crucial for mobile)
  useEffect(() => {
    if (activeAudioSrc && audioRef.current) {
      audioRef.current.load();
      console.log('Loading audio:', activeAudioSrc);
    }
  }, [activeAudioSrc]);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Sync data when user logs in
  useEffect(() => {
    if (user) {
      useMoodStore.getState().syncFromCloud();
    }
  }, [user]);

  // Check for daily reset
  const todayStr = new Date().toISOString().split('T')[0];
  const isNewDay = lastVisitDate !== todayStr;
  
  useEffect(() => {
    if (isNewDay) {
      setIsWakeUp(true);
    }
  }, [isNewDay]);

  const handleSetBaseline = () => {
    // Direct DOM play call - MUST be first
    audioRef.current?.play().catch(e => console.log('Audio play failed', e));

    setTodayBaseline(wakeUpScore);
    setCurrentScore(wakeUpScore); // Sync current score
    // Add a record for baseline
    addRecord({
      score: wakeUpScore,
      note: '晨间打卡'
    });
    
    setIsWakeUp(false);
  };

  const handleSaveRecord = () => {
    // Direct DOM play call - MUST be first
    audioRef.current?.play()
      .then(() => setLastAudioError(''))
      .catch(e => {
        console.log('Audio play failed', e);
        setLastAudioError(`${e.name}: ${e.message}`);
      });

    addRecord({
      score: recordScore,
      note: recordNote || '记录当下'
    });
    
    // Delay closing to prevent race condition and let audio start
    setTimeout(() => {
      setCurrentScore(recordScore);
      setIsRecording(false);
      setRecordNote('');
    }, 1000);
  };

  // Render
  return (
    <>
      {/* Global Audio Element - Persists across state changes */}
      <audio 
        ref={audioRef} 
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} 
        preload="auto"
        playsInline
      >
        <source src={activeAudioSrc} type="audio/mpeg" />
      </audio>

      {isWakeUp ? (
        // Wake Up View
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 w-full max-w-md flex flex-col items-center gap-12"
          >
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-light text-slate-800">早安，观察员</h1>
              <p className="text-slate-500">设定今天的基调</p>
            </div>
            
            <MoodSphere score={wakeUpScore} size={200} />
            
            <MoodSlider value={wakeUpScore} onChange={setWakeUpScore} className="mt-8" />
            
            <button 
              onClick={handleSetBaseline}
              className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-4"
            >
              开启今日
            </button>
          </motion.div>
        </div>
      ) : (
        // Main View
        <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden transition-colors duration-700">
          {/* Header / Nav */}
          <div className="w-full max-w-md p-6 flex justify-between items-center z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  if (user) {
                    if (window.confirm('确定要退出登录吗？')) {
                      logout();
                    }
                  } else {
                    navigate('/login');
                  }
                }}
                className={`p-2 rounded-full transition-colors ${user ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'} relative`}
              >
                <User size={20} />
                {!user && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white transform translate-x-1/3 -translate-y-1/3" />
                )}
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">情绪观察员</span>
              {!user && (
                <span className="text-[10px] text-red-400 font-light mt-0.5 animate-pulse">未登录 (数据仅本地保存)</span>
              )}
            </div>
            
            <UserMenu />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 min-h-[60vh]">
            <MoodSphere score={currentScore} size={320} />
            
            <div className="flex flex-col items-center gap-12 mt-12">
               <button 
                 onClick={() => {
                   setRecordScore(currentScore);
                   setIsRecording(true);
                 }}
                 className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md shadow-lg rounded-full text-slate-700 font-medium hover:bg-white transition-all transform hover:scale-105"
               >
                 <PenLine size={18} />
                 <span>记录当下</span>
               </button>
               
               <div className="text-center px-6">
                 <p className="text-xs text-slate-400 font-light leading-relaxed">
                   "无关好坏，每种情绪都是心灵的一部分，<br/>我们要做的，只是静静地感受、记录并默默地陪伴着它们便好。"
                 </p>
               </div>
            </div>
          </div>

          {/* Record Modal/Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-white flex flex-col"
              >
                <div className="p-6 flex justify-between items-center">
                  <button onClick={() => setIsRecording(false)} className="p-2 rounded-full hover:bg-slate-100">
                    <X size={24} className="text-slate-500" />
                  </button>
                  <span className="font-medium text-slate-800">记录此刻</span>
                  <button onClick={handleSaveRecord} className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                    <Check size={20} />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
                  <MoodSphere score={recordScore} size={180} />
                  <MoodSlider value={recordScore} onChange={setRecordScore} />
                  
                  <div className="w-full max-w-md mt-4">
                    <textarea
                      value={recordNote}
                      onChange={(e) => setRecordNote(e.target.value)}
                      placeholder="今天的旅途中，你又遇到了哪些想要记录的事或情绪？(可选)"
                      maxLength={100}
                      className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-center"
                      rows={3}
                    />
                    <div className="text-right text-xs text-slate-400 mt-2">
                      {recordNote.length}/100
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Debug UI */}
      {lastAudioError && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500/80 text-white text-[10px] p-1 text-center z-[100] pointer-events-none">
          Audio Error: {lastAudioError}
        </div>
      )}
    </>
  );
};
