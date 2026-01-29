import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useMoodStore } from '../store/useMoodStore';
import { SurgeryRecord } from '../types';

export const SurgeryHistoryPage = () => {
  const navigate = useNavigate();
  const { surgeryRecords } = useMoodStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Helper to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get day of week for first day of month (0-6, 0=Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate, daysInMonth, firstDay]);

  // Group records by date string (YYYY-MM-DD) for easy lookup
  const recordsByDate = useMemo(() => {
    const map = new Map<string, SurgeryRecord[]>();
    surgeryRecords.forEach(record => {
      const dateStr = new Date(record.timestamp).toDateString();
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)?.push(record);
    });
    return map;
  }, [surgeryRecords]);

  // Selected date's records
  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    return recordsByDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, recordsByDate]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const hasRecord = (date: Date) => {
    return recordsByDate.has(date.toDateString());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center gap-4 z-10 bg-slate-50">
        <button 
          onClick={() => navigate('/treasure-box')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium text-slate-800">手术记录本</h1>
      </div>

      <div className="w-full max-w-md px-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Calendar Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex-shrink-0">
          {/* Month Navigation */}
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

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
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
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-slate-400 mb-1">原始烦恼</h4>
                      <p className="text-sm text-slate-600 line-through decoration-slate-300 opacity-70">
                        {record.trouble}
                      </p>
                    </div>
                    
                    <div className="relative pl-3 border-l-2 border-purple-200">
                      <h4 className="text-xs font-medium text-purple-500 mb-1">新的认知</h4>
                      <p className="text-base font-medium text-slate-800">
                        {record.newThought}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarIcon size={48} className="mb-4 opacity-20" />
              <p className="text-sm">这一天没有手术记录</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
