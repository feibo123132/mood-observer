import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useControlStore } from '../store/useControlStore';
import { ControlRecord } from '../types';

export const ControlHistoryPage = () => {
  const navigate = useNavigate();
  const { records, deleteRecord, syncFromCloud } = useControlStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    syncFromCloud();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条记录吗？')) {
      await deleteRecord(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const activeRecords = records.filter(r => !r.deletedAt);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button 
          onClick={() => navigate('/treasure-box')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium text-slate-800">控制二分法记录</h1>
        <div className="w-10" />
      </div>

      {/* List */}
      <div className="w-full max-w-md px-6 pb-20 space-y-4">
        {activeRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>还没有记录</p>
            <button 
              onClick={() => navigate('/treasure-box/control-dichotomy')}
              className="mt-4 px-6 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              开始第一次练习
            </button>
          </div>
        ) : (
          activeRecords.map((record) => (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden"
            >
              <div 
                onClick={() => toggleExpand(record.id)}
                className="flex items-start justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono mb-1">
                    {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <h3 className="text-slate-800 font-medium line-clamp-1">{record.challenge}</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-md font-medium">
                     {record.items.filter(i => i.type === 'controllable').length} 可控
                   </span>
                   {expandedId === record.id ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="pt-4 mt-4 border-t border-slate-50"
                  >
                    <div className="space-y-4">
                      {/* Uncontrollable */}
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2">已放下的 (不可控)</div>
                        <div className="flex flex-wrap gap-2">
                          {record.items.filter(i => i.type === 'uncontrollable').map((item, idx) => (
                            <span key={idx} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded decoration-slate-400 line-through opacity-70">
                              {item.text}
                            </span>
                          ))}
                          {record.items.filter(i => i.type === 'uncontrollable').length === 0 && <span className="text-xs text-slate-300">无</span>}
                        </div>
                      </div>

                      {/* Controllable */}
                      <div>
                        <div className="text-xs font-bold text-green-600 mb-2">专注的 (可控)</div>
                        <ul className="space-y-1">
                          {record.items.filter(i => i.type === 'controllable').map((item, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={(e) => handleDelete(e, record.id)}
                          className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
