import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, Clock } from 'lucide-react';
import { MoodSlider } from './MoodSlider';
import { MoodRecord } from '../types';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import { format } from 'date-fns';
import { useMoodStore } from '../store/useMoodStore';

interface RecordEditModalProps {
  record: MoodRecord | null;
  onClose: () => void;
}

export const RecordEditModal = ({ record, onClose }: RecordEditModalProps) => {
  const [note, setNote] = useState('');
  const [score, setScore] = useState(50);
  const { updateRecord, deleteRecord } = useMoodStore();

  useEffect(() => {
    if (record) {
      setNote(record.note || '');
      setScore(record.score);
    }
  }, [record]);

  const handleSave = async () => {
    if (record) {
      await updateRecord(record.id, { note, score });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (record && window.confirm('确定要删除这条记录吗？')) {
      await deleteRecord(record.id);
      onClose();
    }
  };

  if (!record) return null;

  const moodState = record.type === 'harvest' 
    ? { label: getHarvestLevel(score).label, color: getHarvestLevel(score).color, emoji: score === 0 ? '😐' : '🎁' }
    : { ...getMoodState(score), emoji: getMoodState(score).emoji };

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
                <span>{moodState.emoji}</span>
                <span>{moodState.label}</span>
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
          </div>

          <div className="p-6 space-y-8">
            {/* Date Time Display */}
            <div className="flex items-center justify-between text-sm text-slate-400 px-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{format(record.timestamp, 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{format(record.timestamp, 'HH:mm')}</span>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                笔记 / 评论
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-sm leading-relaxed"
                rows={4}
                placeholder="记录下当下的感受..."
              />
            </div>

            {/* Score Slider */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                   调整分数
                 </label>
               </div>
               
               {record.type === 'harvest' ? (
                  /* Harvest Slider */
                   <div className="w-full h-2 bg-slate-100 rounded-full relative">
                      {/* Track Background - Colored Segments */}
                      <div className="absolute inset-0 rounded-full overflow-hidden flex">
                         <div className="h-full bg-gray-400" style={{ width: '70%' }} />
                         <div className="h-full bg-green-500" style={{ width: '10%' }} />
                         <div className="h-full bg-blue-500" style={{ width: '10%' }} />
                         <div className="h-full bg-purple-500" style={{ width: '6%' }} />
                         <div className="h-full bg-yellow-500" style={{ width: '4%' }} />
                      </div>

                      {/* Thumb */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md border-4 transition-all duration-75 pointer-events-none z-20"
                        style={{ 
                            left: `${score}%`, 
                            transform: `translate(-50%, -50%)`,
                            borderColor: moodState.color
                        }}
                      />

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      />
                   </div>
               ) : (
                  /* Mood Slider */
                  <MoodSlider value={score} onChange={setScore} />
               )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 px-4 rounded-xl border border-red-100 text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                删除
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                <Save size={18} />
                保存修改
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
