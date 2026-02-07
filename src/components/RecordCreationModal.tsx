import { X, Save, Calendar, Clock, Trees, Map, RefreshCw, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import { format } from 'date-fns';
import { useState } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { MoodSlider } from './MoodSlider';

interface RecordCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
}

export const RecordCreationModal = ({ isOpen, onClose, initialDate }: RecordCreationModalProps) => {
  const [note, setNote] = useState('');
  const [score, setScore] = useState(50);
  const [recordType, setRecordType] = useState<'mood' | 'harvest'>('mood');
  const { addRecord } = useMoodStore();

  const handleSave = async () => {
    // Set timestamp to the selected date but keep current time (or set to noon/default)
    // Since we want to "add for a specific day", maybe we should preserve the time?
    // But usually "supplementary record" implies "for that day". 
    // Let's use the current time but on the selected date.
    const now = new Date();
    const targetTimestamp = new Date(initialDate);
    targetTimestamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    await addRecord({
      score,
      note: note || (recordType === 'harvest' ? '收获记录' : '补记心情'),
      type: recordType,
      timestamp: targetTimestamp.getTime()
    });
    
    // Reset and close
    setNote('');
    setScore(50);
    setRecordType('mood');
    onClose();
  };

  const toggleRecordType = () => {
    const newType = recordType === 'mood' ? 'harvest' : 'mood';
    setRecordType(newType);
    setScore(newType === 'harvest' ? 60 : 50);
  };

  if (!isOpen) return null;

  const moodState = recordType === 'harvest' 
    ? { label: getHarvestLevel(score).label, color: getHarvestLevel(score).color, emoji: score === 0 ? '😐' : '🎁' }
    : getMoodState(score);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with dynamic color */}
          <div 
            className="p-6 text-center text-white transition-colors duration-500 relative overflow-hidden"
            style={{ backgroundColor: moodState.color }}
          >
            <div className="relative z-10">
              <div className="text-5xl font-bold mb-2">{score}</div>
              <div className="text-lg font-medium opacity-90 flex items-center justify-center gap-2">
                <span>{moodState.label}</span>
                {/* Type Toggle */}
                <button 
                   onClick={toggleRecordType}
                   className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors ml-2"
                   title="切换模式"
                 >
                   {recordType === 'mood' ? <RefreshCw size={14} /> : <Box size={14} />}
                 </button>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-50"
            >
              <X size={20} />
            </button>
            
            {/* Type Indicator Icon */}
            <div className="absolute top-4 left-4 p-2 bg-white/20 rounded-full">
                {recordType === 'mood' ? <Trees size={20} /> : <Map size={20} />}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Date Time Display */}
            <div className="flex items-center justify-between text-sm text-slate-400 px-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{format(initialDate, 'yyyy-MM-dd')} (补记)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{format(new Date(), 'HH:mm')}</span>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                {recordType === 'mood' ? '心情笔记' : '宝藏线索'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-sm leading-relaxed"
                rows={4}
                placeholder={recordType === 'mood' ? "当时发生了什么？..." : "发现了什么宝藏？..."}
                maxLength={300}
              />
              <div className="text-right text-xs text-slate-400">
                {note.length}/300
              </div>
            </div>

            {/* Score Slider */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">
                {recordType === 'mood' ? '情绪强度' : '宝藏稀有度'}
              </h3>
              {recordType === 'harvest' ? (
                 /* Harvest Slider using MoodSlider component logic (Customized) */
                 <div className="w-full max-w-md flex flex-col items-center gap-6">
                   {/* Custom Harvest Slider Track */}
                   <div className="w-full h-2 bg-slate-100 rounded-full relative">
                      {/* Track Background - Colored Segments */}
                      <div className="absolute inset-0 rounded-full overflow-hidden flex">
                         <div className="h-full bg-gray-400" style={{ width: '25%' }} />
                         <div className="h-full bg-green-500" style={{ width: '25%' }} />
                         <div className="h-full bg-blue-500" style={{ width: '25%' }} />
                         <div className="h-full bg-purple-500" style={{ width: '15%' }} />
                         <div className="h-full bg-yellow-500" style={{ width: '10%' }} />
                      </div>

                      {/* Thumb */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md border-4 transition-all duration-75 pointer-events-none z-20"
                        style={{ 
                            left: `${(score - 60) / 40 * 100}%`, 
                            transform: `translate(-50%, -50%)`,
                            borderColor: moodState.color
                        }}
                      />

                      <input
                        type="range"
                        min="60"
                        max="100"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      />
                   </div>
                 </div>
              ) : (
                <MoodSlider value={score} onChange={setScore} />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSave}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                <Save size={18} />
                确认补记
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
