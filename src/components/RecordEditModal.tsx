import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, Clock } from 'lucide-react';
import { MoodRecord } from '../types';
import { getMoodState } from '../utils/moodUtils';
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

  // Use current dynamic score for preview
  const moodState = getMoodState(score);
  const date = new Date(record.timestamp);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header with Color */}
          <div 
            className="h-28 w-full relative flex flex-col items-center justify-center transition-colors duration-300"
            style={{ background: `linear-gradient(to bottom right, ${moodState.color}22, ${moodState.color}44)` }}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X size={18} className="text-slate-600" />
            </button>
            
            <div className="text-center">
              <div 
                className="text-4xl font-bold mb-1 transition-colors duration-300"
                style={{ color: moodState.color }}
              >
                {score}
              </div>
              <div className="text-sm font-medium text-slate-600 opacity-80">
                {moodState.label}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Meta Info */}
            <div className="flex justify-between text-xs text-slate-400 font-mono bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                {format(date, 'yyyy-MM-dd')}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                {format(date, 'HH:mm')}
              </div>
            </div>

            {/* Note Edit Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                笔记 / 评论
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-24 p-3 bg-slate-50 border border-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 text-sm leading-relaxed"
                placeholder="写点什么..."
              />
            </div>

            {/* Score Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>调整分数</span>
                <span>{score}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                style={{
                  background: `linear-gradient(to right, ${moodState.color} 0%, ${moodState.color} ${score}%, #e2e8f0 ${score}%, #e2e8f0 100%)`
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDelete}
                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors font-medium text-sm"
              >
                <Trash2 size={16} />
                删除
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium text-sm shadow-md"
              >
                <Save size={16} />
                保存修改
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
