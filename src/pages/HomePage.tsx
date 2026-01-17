import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodSphere } from '../components/MoodSphere';
import { MoodSlider } from '../components/MoodSlider';
import { useMoodStore } from '../store/useMoodStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore, AudioMode } from '../store/useSettingsStore';
import { PenLine, X, Check, User, RefreshCw, Box, Trees, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from '../components/UserMenu';
import { audioPlayer } from '../services/AudioPlayer';
import { getHarvestLevel, snapHarvestScore } from '../utils/harvestUtils';

export const HomePage = () => {
  const { 
    currentScore, 
    setCurrentScore, 
    lastVisitDate, 
    setTodayBaseline, 
    addRecord 
  } = useMoodStore();

  const { user, initAuth, logout } = useAuthStore();
  
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [moodNote, setMoodNote] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [recordScore, setRecordScore] = useState(currentScore);
  const [recordType, setRecordType] = useState<'mood' | 'harvest'>('mood');

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

  // Preload audio when modal opens
  useEffect(() => {
    if (isRecording) {
      audioPlayer.preload(recordScore);
    }
  }, [isRecording, recordScore]);

  // Check for daily reset
  const todayStr = new Date().toISOString().split('T')[0];
  const isNewDay = lastVisitDate !== todayStr;
  
  // Local state for "Wake Up" flow
  const [isWakeUp, setIsWakeUp] = useState(false);
  const [wakeUpScore, setWakeUpScore] = useState(50);

  useEffect(() => {
    if (isNewDay) {
      setIsWakeUp(true);
    }
  }, [isNewDay]);

  // Preload audio when wake up score changes
  useEffect(() => {
    if (isWakeUp) {
      audioPlayer.preload(wakeUpScore);
    }
  }, [wakeUpScore, isWakeUp]);

  const handleSetBaseline = () => {
    setTodayBaseline(wakeUpScore);
    setCurrentScore(wakeUpScore); // Sync current score
    // Add a record for baseline
    addRecord({
      score: wakeUpScore,
      note: '晨间打卡'
    });
    // Trigger sound
    audioPlayer.play(wakeUpScore);
    
    setIsWakeUp(false);
  };

  const handleSaveRecord = () => {
    addRecord({
      score: recordScore,
      note: (recordType === 'mood' ? moodNote : harvestNote) || (recordType === 'harvest' ? '收获记录' : '记录当下'),
      type: recordType
    });
    
    if (recordType === 'mood') {
        setCurrentScore(recordScore);
    }
    
    // Trigger sound
    audioPlayer.play(recordScore);

    setIsRecording(false);
    setMoodNote('');
    setHarvestNote('');
    // Reset type to mood for next time, or keep it? User didn't specify. Keeping it 'mood' is safer or maybe preserve state.
    // Let's reset to default to avoid confusion
    setRecordType('mood'); 
  };

  const toggleRecordType = () => {
    const newType = recordType === 'mood' ? 'harvest' : 'mood';
    setRecordType(newType);
    setRecordScore(50); // Reset score to middle as requested
  };

  // If Wake Up mode
  if (isWakeUp) {
    return (
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
    );
  }

  return (
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
          <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">JIEYOU不解忧</span>
          {!user && (
            <span className="text-[10px] text-red-400 font-light mt-0.5 animate-pulse">未登录 (数据仅本地保存)</span>
          )}
        </div>
        
        <UserMenu />
      </div>

      {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 min-h-[60vh]">
            <MoodSphere score={currentScore} size={320} />
            
            <div className="flex flex-col items-center gap-12 mt-24">
               <button 
                 onClick={() => {
                   setRecordScore(currentScore);
                   setRecordType('mood'); // Default to mood
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
              
              <div className="flex items-center gap-2">
                 <span className="font-medium text-slate-800 flex items-center gap-2">
                    {recordType === 'mood' ? (
                      <>
                        <Trees size={18} className="text-green-600" />
                        情绪之森
                      </>
                    ) : (
                      <>
                        <Map size={18} className="text-amber-500" />
                        宝箱之旅
                      </>
                    )}
                 </span>
                 <button 
                   onClick={toggleRecordType}
                   className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                   title="切换模式"
                 >
                   {recordType === 'mood' ? <Box size={14} /> : <RefreshCw size={14} />}
                 </button>
              </div>

              <button onClick={handleSaveRecord} className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                <Check size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
              
              {recordType === 'mood' ? (
                 /* Mood Mode */
                 <>
                    <MoodSphere score={recordScore} size={180} />
                    <MoodSlider value={recordScore} onChange={setRecordScore} />
                 </>
              ) : (
                 /* Harvest Mode */
                 (() => {
                    const level = getHarvestLevel(recordScore);
                    return (
                        <>
                           {/* Solid Sphere with improved style matching MoodSphere */}
                           <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                             {/* Always show sphere with visual effects, even for Common level (grey) */}
                             <>
                                 {/* Glow effect */}
                                 <motion.div
                                   className="absolute inset-0 rounded-full blur-3xl opacity-40"
                                   animate={{
                                     scale: [1, 1.2, 1],
                                     opacity: [0.3, 0.5, 0.3],
                                   }}
                                   transition={{
                                     duration: 3, // Consistent moderate breathing
                                     repeat: Infinity,
                                     ease: "easeInOut"
                                   }}
                                   style={{ background: level.color }}
                                 />
                                 
                                 {/* Core Sphere */}
                                 <motion.div
                                   className="w-full h-full rounded-full relative z-10"
                                   animate={{
                                     scale: [0.95, 1.05, 0.95],
                                   }}
                                   transition={{
                                     duration: 3,
                                     repeat: Infinity,
                                     ease: "easeInOut"
                                   }}
                                   style={{
                                     background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${level.color})`,
                                     boxShadow: `0 0 60px ${level.color}`,
                                   }}
                                 />
                             </>
                           </div>
 
                           {/* Level Text Info */}
                           <div className="text-center space-y-2">
                              <h3 className="text-2xl font-bold" style={{ color: level.color }}>
                                {level.label}
                              </h3>
                              <p className="text-sm text-slate-500">{level.description}</p>
                           </div>

                           {/* Continuous Slider with Colored Segments */}
                           <div className="w-full max-w-md h-2 bg-slate-100 rounded-full relative">
                              {/* Track Background - Colored Segments */}
                              <div className="absolute inset-0 rounded-full overflow-hidden flex">
                                 {/* Common: 0-69 (70%) */}
                                 <div className="h-full bg-gray-400" style={{ width: '70%' }} />
                                 {/* Fine: 70-79 (10%) */}
                                 <div className="h-full bg-green-500" style={{ width: '10%' }} />
                                 {/* Rare: 80-89 (10%) */}
                                 <div className="h-full bg-blue-500" style={{ width: '10%' }} />
                                 {/* Epic: 90-95 (6%) */}
                                 <div className="h-full bg-purple-500" style={{ width: '6%' }} />
                                 {/* Legendary: 96-100 (4%) */}
                                 <div className="h-full bg-yellow-500" style={{ width: '4%' }} />
                              </div>

                              {/* Thumb */}
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md border-4 transition-all duration-75 pointer-events-none z-20"
                                style={{ 
                                    left: `${recordScore}%`, 
                                    transform: `translate(-50%, -50%)`,
                                    borderColor: level.color
                                }}
                              />

                              {/* Input Range */}
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={recordScore}
                                onChange={(e) => setRecordScore(Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                              />
                           </div>
                        </>
                    );
                 })()
              )}

              
              <div className="w-full max-w-md mt-4">
                <textarea
                  value={recordType === 'mood' ? moodNote : harvestNote}
                  onChange={(e) => recordType === 'mood' ? setMoodNote(e.target.value) : setHarvestNote(e.target.value)}
                  placeholder={recordType === 'mood' ? "今天的旅途，你又遇到了哪些想要记录的事或情绪？(可选)" : "今天的旅途，你又收获了哪些值得记录的宝箱？（可选）"}
                  maxLength={100}
                  className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-center"
                  rows={3}
                />
                <div className="text-right text-xs text-slate-400 mt-2">
                  {(recordType === 'mood' ? moodNote : harvestNote).length}/100
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
