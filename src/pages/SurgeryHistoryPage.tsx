import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, RefreshCw, Trash2, Menu } from 'lucide-react';
import { useSurgeryStore } from '../store/useSurgeryStore';
import { SurgeryRecord } from '../types';
import { SurgeryDetailModal } from '../components/SurgeryDetailModal';

export const SurgeryHistoryPage = () => {
  const navigate = useNavigate();
  
  // 使用 Selector 模式确保状态更新响应
  const surgeryRecords = useSurgeryStore((state) => state.records);
  const syncFromCloud = useSurgeryStore((state) => state.syncFromCloud);
  const isSyncing = useSurgeryStore((state) => state.isSyncing);
  const deleteRecord = useSurgeryStore((state) => state.deleteRecord);
  const updateRecord = useSurgeryStore((state) => state.updateRecord);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewingRecord, setViewingRecord] = useState<SurgeryRecord | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    syncFromCloud();
  }, []);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate, daysInMonth, firstDay]);

  const recordsByDate = useMemo(() => {
    const safeRecords = Array.isArray(surgeryRecords) ? surgeryRecords : [];
    const map = new Map<string, any[]>();
    
    safeRecords
      .filter(record => !record.deletedAt) // Filter out deleted records
      .forEach(record => {
      let ts = Number(record.timestamp);
      if (!ts || isNaN(ts)) {
        if (record.createTime) {
          ts = new Date(record.createTime).getTime();
        } else {
          ts = Date.now();
        }
      }
      const dateObj = new Date(ts);
      const key = getDateKey(dateObj); 
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(record);
    });
    
    return map;
  }, [surgeryRecords]);

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    const key = getDateKey(selectedDate);
    return recordsByDate.get(key) || [];
  }, [selectedDate, recordsByDate]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return getDateKey(d1) === getDateKey(d2);
  };

  const hasRecord = (date: Date) => {
    return recordsByDate.has(getDateKey(date));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between gap-4 z-10 bg-slate-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/treasure-box')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-medium text-slate-800">疗愈回顾</h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          >
            <Menu size={24} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
              >
                <button
                  onClick={() => {
                    navigate('/treasure-box/surgery-trash');
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm text-slate-600"
                >
                  <Trash2 size={16} className="text-slate-400" />
                  回收站
                </button>
                <button
                  onClick={() => {
                    syncFromCloud();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm text-slate-600"
                >
                  <RefreshCw size={16} className={`text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  同步数据
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full max-w-md px-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Calendar Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </h2>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;
              
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const hasData = hasRecord(date);

              return (
                <div key={date.toISOString()} className="aspect-square flex flex-col items-center justify-center relative">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                      ${isSelected 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                        : isToday 
                          ? 'bg-purple-50 text-purple-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                  {hasData && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-purple-400 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-slate-400" />
            <h3 className="text-sm font-medium text-slate-500">
              {selectedDate ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日` : '请选择日期'} 的记录
            </h3>
          </div>

          {selectedRecords.length > 0 ? (
            <div className="space-y-4">
              {selectedRecords.map((record, index) => (
                <motion.div
                  key={record.id || index}
                  layoutId={record.id}
                  onClick={() => setViewingRecord(record)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      {new Date(Number(record.timestamp) || record.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-slate-400 mb-1">原始烦恼</h4>
                      <p className="text-sm text-slate-600 line-through decoration-slate-300 opacity-70 line-clamp-2">
                        {record.issue || record.trouble || '未记录'}
                      </p>
                    </div>
                    
                    <div className="relative pl-3 border-l-2 border-purple-200">
                      <h4 className="text-xs font-medium text-purple-500 mb-1">新的认知</h4>
                      <p className="text-base font-medium text-slate-800 line-clamp-3">
                        {record.conclusion || record.newThought || '未生成'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarIcon size={48} className="mb-4 opacity-20" />
              <p className="text-sm">这一天没有疗愈记录</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewingRecord && (
          <SurgeryDetailModal
            record={viewingRecord}
            onClose={() => setViewingRecord(null)}
            onDelete={deleteRecord}
            onUpdate={updateRecord}
          />
        )}
      </AnimatePresence>
    </div>
  );
};