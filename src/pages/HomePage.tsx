import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoodSphere } from '../components/MoodSphere';
import { MoodSlider } from '../components/MoodSlider';
import { useMoodStore } from '../store/useMoodStore';
import { Calendar, PenLine, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const { 
    currentScore, 
    setCurrentScore, 
    lastVisitDate, 
    setTodayBaseline, 
    addRecord 
  } = useMoodStore();
  
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordNote, setRecordNote] = useState('');
  const [recordScore, setRecordScore] = useState(currentScore);

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

  const handleSetBaseline = () => {
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
    addRecord({
      score: recordScore,
      note: recordNote || '记录当下'
    });
    setCurrentScore(recordScore);
    setIsRecording(false);
    setRecordNote('');
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
          
          <MoodSlider value={wakeUpScore} onChange={setWakeUpScore} />
          
          <button 
            onClick={handleSetBaseline}
            className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
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
        <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">情绪观察员</span>
        <button 
          onClick={() => navigate('/calendar')}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <Calendar size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 -mt-10">
        <MoodSphere score={currentScore} size={320} />
        
        {/* Actions */}
        <div className="absolute bottom-20 w-full flex justify-center">
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
        </div>
      </div>

      {/* Quote */}
      <div className="w-full max-w-md p-6 text-center z-10 pb-8">
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          "每种情绪都是我们的一部分，<br/>我们只需要静静地感受、记录并不加评判地看着它们就好。"
        </p>
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
                  placeholder="发生了什么？(可选)..."
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
  );
};
