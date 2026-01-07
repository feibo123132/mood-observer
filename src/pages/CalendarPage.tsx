import { useState, useMemo } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getMoodColor } from '../utils/moodUtils';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const { records, deleteRecord } = useMoodStore();
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Aggregate daily stats
  const dailyStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    records.forEach(r => {
      const dateKey = format(new Date(r.timestamp), 'yyyy-MM-dd');
      if (!stats[dateKey]) stats[dateKey] = { total: 0, count: 0 };
      stats[dateKey].total += r.score;
      stats[dateKey].count += 1;
    });
    return stats;
  }, [records]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Calculate padding days for grid alignment
  const startDay = getDay(startOfMonth(currentDate)); // 0 = Sun
  const paddingDays = Array(startDay).fill(null);

  const getDayColor = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const stat = dailyStats[key];
    if (!stat) return 'transparent';
    const avg = Math.round(stat.total / stat.count);
    return getMoodColor(avg);
  };

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    return records
      .filter(r => isSameDay(new Date(r.timestamp), selectedDate))
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [selectedDate, records]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">
          {format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="w-full max-w-md px-6 pb-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-xs text-slate-400 font-medium py-2">
              {d}
            </div>
          ))}
          
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {daysInMonth.map(date => {
            const color = getDayColor(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const hasData = color !== 'transparent';
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-full flex items-center justify-center text-sm relative transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''
                } hover:bg-slate-100`}
              >
                <span className={`z-10 ${hasData ? 'text-white font-medium shadow-sm' : 'text-slate-400'}`}>
                  {format(date, 'd')}
                </span>
                {hasData && (
                  <div 
                    className="absolute inset-0 rounded-full opacity-90 transition-colors duration-500" 
                    style={{ background: color }} 
                  />
                )}
                {!hasData && (
                  <div className="absolute inset-0 rounded-full bg-slate-100" />
                )}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {selectedDate && (
          <motion.div 
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              {format(selectedDate, 'yyyy年 MMMM d日', { locale: zhCN })}
            </h3>
            
            {selectedRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-light italic">
                今日暂无记录。
              </div>
            ) : (
              selectedRecords.map(record => (
                <div key={record.id} className="flex gap-4 items-start relative pl-4 border-l-2 border-slate-100 last:border-transparent">
                  <div 
                    className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-white shadow-sm ring-2 ring-slate-50"
                    style={{ background: getMoodColor(record.score) }}
                  />
                  <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 font-mono">
                        {format(new Date(record.timestamp), 'HH:mm')}
                      </span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('确定要删除这条记录吗？')) {
                              deleteRecord(record.id);
                            }
                          }}
                          className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span 
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: getMoodColor(record.score) }}
                        >
                          {record.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {record.note}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
