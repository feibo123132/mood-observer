import { useState, useMemo, useEffect } from 'react';
import { useSurgeryStore } from '../store/useSurgeryStore';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, RotateCcw, Clock, CheckSquare, Square, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const SurgeryTrashPage = () => {
  const navigate = useNavigate();
  const { records, restoreRecord, restoreMultipleRecords, permanentDeleteRecord, permanentDeleteMultipleRecords, cleanupTrash } = useSurgeryStore();
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchPermanentDelete = async () => {
    if (window.confirm(`确定要彻底删除选中的 ${selectedIds.size} 条疗愈记录吗？此操作无法撤销。`)) {
      await permanentDeleteMultipleRecords(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleBatchRestore = async () => {
    if (window.confirm(`确定要恢复选中的 ${selectedIds.size} 条疗愈记录吗？`)) {
      await restoreMultipleRecords(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">
          心事回收站
        </span>
        <button 
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedIds(new Set());
          }}
          className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
            isSelectionMode ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-400'
          }`}
          title="批量管理"
        >
          <CheckSquare size={20} />
        </button>
      </div>

      {/* List */}
      <div className="w-full max-w-md px-6 pb-24 space-y-4">
        {deletedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Trash2 size={48} className="mb-4 opacity-20" />
            <p className="text-sm">回收站是空的</p>
          </div>
        ) : (
          <AnimatePresence>
            {deletedRecords.map(record => {
              const daysLeft = getDaysRemaining(record.deletedAt);

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex gap-3 items-center"
                >
                  {/* Checkbox for Selection Mode */}
                  <AnimatePresence initial={false}>
                    {isSelectionMode && (
                      <motion.div
                        initial={{ width: 0, opacity: 0, marginRight: 0 }}
                        animate={{ width: 'auto', opacity: 1, marginRight: 8 }}
                        exit={{ width: 0, opacity: 0, marginRight: 0 }}
                        className="overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSelection(record.id)}
                          className="p-1"
                        >
                          {selectedIds.has(record.id) ? (
                            <CheckSquare size={20} className="text-slate-800" />
                          ) : (
                            <Square size={20} className="text-slate-300" />
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div 
                    onClick={() => isSelectionMode && toggleSelection(record.id)}
                    className={`flex-1 bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
                      isSelectionMode && selectedIds.has(record.id) 
                        ? 'border-purple-400 ring-1 ring-purple-400' 
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-50 p-1.5 rounded-md">
                          <BrainCircuit size={14} className="text-purple-500" />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {format(new Date(record.timestamp), 'MM-dd HH:mm')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-orange-400 flex items-center gap-1">
                        <Clock size={12} />
                        {daysLeft}天后清除
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-slate-600 text-sm font-medium line-clamp-1">
                        {record.trouble}
                      </p>
                      <p className="text-purple-600 text-xs line-clamp-1 bg-purple-50 px-2 py-1 rounded w-fit">
                        → {record.newThought || '未生成结论'}
                      </p>
                    </div>

                    {!isSelectionMode && (
                      <div className="flex gap-2 border-t border-slate-50 pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            permanentDeleteRecord(record.id);
                          }}
                          className="flex-1 py-2 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
                          彻底删除
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreRecord(record.id);
                          }}
                          className="flex-1 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <RotateCcw size={14} />
                          恢复
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      
      {/* Batch Action Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 w-full max-w-md px-6 z-30"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 pl-2 mr-auto">
                已选 {selectedIds.size} 项
              </span>
              <button
                onClick={handleBatchRestore}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
              >
                <RotateCcw size={14} />
                恢复
              </button>
              <button
                onClick={handleBatchPermanentDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
              >
                <Trash2 size={14} />
                彻底删除
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSelectionMode && (
        <div className="fixed bottom-6 text-xs text-slate-400 text-center w-full max-w-md px-6">
          项目将在删除 7 天后被自动永久清除
        </div>
      )}
    </div>
  );
};
