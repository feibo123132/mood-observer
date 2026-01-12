import { useState, useMemo, useEffect } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getMoodState, getGradientColor } from '../utils/moodUtils';
import { ArrowLeft, Trash2, RotateCcw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const TrashPage = () => {
  const navigate = useNavigate();
  const { records, restoreRecord, permanentDeleteRecord, cleanupTrash } = useMoodStore();
  
  // Auto cleanup on mount
  useEffect(() => {
    cleanupTrash();
  }, [cleanupTrash]);

  const deletedRecords = useMemo(() => {
    return records
      .filter(r => r.deletedAt)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }, [records]);

  const getDaysRemaining = (deletedAt?: number) => {
    if (!deletedAt) return 0;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const remaining = SEVEN_DAYS - (now - deletedAt);
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">
          回收站
        </span>
        <div className="w-10" />
      </div>

      {/* List */}
      <div className="w-full max-w-md px-6 pb-20 space-y-4">
        {deletedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Trash2 size={48} className="mb-4 opacity-20" />
            <p className="text-sm">回收站是空的</p>
          </div>
        ) : (
          <AnimatePresence>
            {deletedRecords.map(record => {
              const moodState = getMoodState(record.score);
              const color = getGradientColor(record.score);
              const daysLeft = getDaysRemaining(record.deletedAt);

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {moodState.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {format(new Date(record.timestamp), 'MM-dd HH:mm')}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-orange-400 flex items-center gap-1">
                      <Clock size={12} />
                      {daysLeft}天后清除
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {record.note}
                  </p>

                  <div className="flex gap-2 border-t border-slate-50 pt-3">
                    <button
                      onClick={() => permanentDeleteRecord(record.id)}
                      className="flex-1 py-2 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
                      彻底删除
                    </button>
                    <button
                      onClick={() => restoreRecord(record.id)}
                      className="flex-1 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <RotateCcw size={14} />
                      恢复
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      
      <div className="fixed bottom-6 text-xs text-slate-400 text-center w-full max-w-md px-6">
        项目将在删除 7 天后被自动永久清除
      </div>
    </div>
  );
};
