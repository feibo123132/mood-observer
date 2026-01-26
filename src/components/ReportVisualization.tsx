import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useMoodStore } from '../store/useMoodStore';
import { format, parseISO, isWithinInterval, setISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ReportVisualizationProps {
  year: number;
  week: number;
}

const ReportVisualization: React.FC<ReportVisualizationProps> = ({ year, week }) => {
  const { records } = useMoodStore();
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const weekData = useMemo(() => {
    // 1. Get a date within the target week
    const someDateInTargetWeek = setISOWeek(new Date(year, 0, 1), week);
    
    // 2. Calculate the precise start and end of that ISO week
    const weekStart = startOfISOWeek(someDateInTargetWeek);
    const weekEnd = endOfISOWeek(someDateInTargetWeek);

    // 3. Filter using the correct interval
    const filtered = records.filter(r => {
      let dateStr = r.date;
      if (!dateStr && r.timestamp) {
        dateStr = new Date(r.timestamp).toISOString();
      }
      if (!dateStr) return false;
      return isWithinInterval(parseISO(dateStr), { start: weekStart, end: weekEnd });
    }).map(r => ({
      ...r,
      date: r.date || new Date(r.timestamp).toISOString()
    }));

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, year, week]);

  // Stats
  const stats = useMemo(() => {
    if (weekData.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
    const scores = weekData.map(r => r.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / scores.length),
      max: Math.max(...scores),
      min: Math.min(...scores),
      count: scores.length
    };
  }, [weekData]);

  // Chart Data
  const chartData = useMemo(() => {
    return weekData.map(r => ({
      date: format(parseISO(r.date), 'EEE', { locale: zhCN }),
      fullDate: format(parseISO(r.date), 'MM-dd HH:mm'),
      score: r.score,
      mood: r.type === 'harvest' ? getHarvestLevel(r.score).label : getMoodState(r.score).label,
      // FIXED: Always use mood emoji based on score, ignoring harvest type (no wheat icon)
      emoji: getMoodState(r.score).emoji,
      note: r.note,
      originalRecord: r
    }));
  }, [weekData]);

  // Mood Distribution
  const moodDist = useMemo(() => {
    const dist: Record<string, number> = {};
    weekData.forEach(r => {
      const label = r.type === 'harvest' ? getHarvestLevel(r.score).label : getMoodState(r.score).label;
      dist[label] = (dist[label] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by frequency
  }, [weekData]);

  // Dynamic Theme based on average score
  const themeColor = useMemo(() => {
    if (stats.avg >= 80) return { bg: 'from-amber-50 to-orange-100', text: 'text-orange-900', accent: 'bg-orange-500', label: 'Radiant', sub: 'Flow' };
    if (stats.avg >= 60) return { bg: 'from-blue-50 to-indigo-100', text: 'text-indigo-900', accent: 'bg-indigo-500', label: 'Balanced', sub: 'Flow' };
    return { bg: 'from-slate-100 to-zinc-200', text: 'text-slate-800', accent: 'bg-slate-600', label: 'Quiet', sub: 'Stillness' };
  }, [stats.avg]);

  if (weekData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-light">
        <div className="text-4xl mb-4 opacity-50">🍃</div>
        <div className="tracking-widest uppercase text-xs">暂无数据记录</div>
      </div>
    );
  }

  return (
    <div className={clsx("relative overflow-hidden rounded-3xl transition-colors duration-500 bg-gradient-to-br p-6 sm:p-8", themeColor.bg)}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/30 blur-2xl rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Header / Hero Section */}
      <div className="relative z-10 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-start"
        >
          <span className={clsx("text-xs font-bold tracking-[0.2em] uppercase mb-2 opacity-60", themeColor.text)}>周报洞察</span>
          <h2 className={clsx("text-5xl sm:text-6xl font-serif font-medium leading-tight", themeColor.text)}>
            {themeColor.label} <br />
            <span className="opacity-50 italic">{themeColor.sub}</span>
          </h2>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute top-0 right-0 flex flex-col items-end"
        >
          <div className={clsx("text-6xl sm:text-7xl font-light tracking-tighter", themeColor.text)}>
            {stats.avg}
          </div>
          <div className={clsx("text-xs font-medium uppercase tracking-wider opacity-50", themeColor.text)}>平均分</div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-12 lg:col-span-8 bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/50"
        >
          <div className="flex justify-between items-end mb-6">
            <h3 className={clsx("text-sm font-bold uppercase tracking-widest opacity-70", themeColor.text)}>情绪韵律</h3>
            <span className={clsx("text-xs opacity-50", themeColor.text)}>{chartData.length} 条记录</span>
          </div>
          
          <div className="h-48 w-full -ml-2 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                onClick={(e) => {
                  // Robust click handling: check activePayload
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="gradientScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" className={themeColor.text} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="currentColor" className={themeColor.text} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  trigger="hover" // Ensure hover triggers tooltip, but click triggers modal
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const noteText = data.note || data.originalRecord?.note || "";
                      return (
                        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 text-xs min-w-[180px] max-w-[320px] transition-all duration-200">
                          <div className="font-bold text-slate-800 mb-2 text-center text-[10px] opacity-60 font-mono tracking-tight">{data.fullDate}</div>
                          <div className="flex items-center justify-center gap-3 text-slate-700 mb-3">
                             <span className="text-3xl filter drop-shadow-sm">{data.emoji}</span>
                             <div className="text-3xl font-light font-serif text-slate-800">{data.score}</div>
                          </div>
                          
                          {/* Note Preview - Dynamic height */}
                          {noteText && (
                            <div className="bg-slate-50 rounded-xl p-3 text-slate-600 leading-relaxed text-[11px] border border-slate-100 break-words whitespace-pre-wrap">
                              {noteText}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '2 4', strokeOpacity: 0.2 }}
                  // Increase z-index to ensure it floats above everything
                  wrapperStyle={{ zIndex: 50 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="currentColor" 
                  className={themeColor.text}
                  strokeWidth={2}
                  fill="url(#gradientScore)" 
                  fillOpacity={1}
                  activeDot={{ r: 6, strokeWidth: 0, className: "fill-slate-800 animate-pulse cursor-pointer" }}
                  onClick={(data, index, e) => {
                     // Additional click handler on the Area itself
                     // Note: Recharts Area onClick passes (data, index, event) where data is the point data
                     // But sometimes data is null depending on version. 
                     // The chart-level onClick is usually more reliable for activePayload.
                     // We keep this just in case.
                     if (data && data.payload) {
                        setSelectedPoint(data.payload);
                        // Stop propagation to prevent double trigger if chart onClick also fires
                        if (e && e.stopPropagation) e.stopPropagation();
                     }
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stats / Distribution Column */}
        <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Total Count Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={clsx("bg-white/40 backdrop-blur-md rounded-2xl p-6 flex items-center justify-between border border-white/30", themeColor.text)}
          >
            <div>
              <div className="text-3xl font-light">{stats.count}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-60">总记录数</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center text-xl">
              📝
            </div>
          </motion.div>

          {/* Distribution List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50"
          >
            <h3 className={clsx("text-sm font-bold uppercase tracking-widest opacity-70 mb-4", themeColor.text)}>心情构成</h3>
            <div className="space-y-3">
              {moodDist.slice(0, 4).map((item, i) => (
                <div key={item.name} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium truncate max-w-[70%]">{item.name}</span>
                    <span className="text-slate-400">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / stats.count) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={clsx("h-full rounded-full opacity-80", themeColor.accent)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPoint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPoint(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`point-${selectedPoint.fullDate}`}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
               {/* New Modal Design */}
               {/* 1. Colored Header */}
               <div className={clsx("w-full p-8 flex flex-col items-center justify-center relative text-white transition-colors duration-300", 
                  selectedPoint.score >= 96 ? 'bg-yellow-500' :
                  selectedPoint.score >= 90 ? 'bg-purple-500' :
                  selectedPoint.score >= 80 ? 'bg-blue-500' :
                  selectedPoint.score >= 70 ? 'bg-green-500' :
                  selectedPoint.score >= 60 ? 'bg-emerald-400' :
                  selectedPoint.score >= 50 ? 'bg-teal-200' : 'bg-slate-400'
               )}>
                 <div className="text-6xl font-bold mb-2">{selectedPoint.score}</div>
                 <div className="flex items-center gap-2 opacity-90">
                   <span className="text-xl">{selectedPoint.emoji}</span>
                   <span className="text-lg font-medium">{selectedPoint.mood.split(' ')[0]}</span>
                 </div>
                 
                 {/* Close Button */}
                 <button 
                   onClick={() => setSelectedPoint(null)}
                   className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                 >
                   <X size={20} className="text-white" />
                 </button>
               </div>

               {/* 2. Content Body */}
               <div className="p-6 bg-slate-50">
                 {/* Date & Time Row */}
                 <div className="flex items-center justify-between text-slate-400 text-sm mb-6 px-1">
                   <div className="flex items-center gap-2">
                     <span className="w-4 h-4 flex items-center justify-center opacity-70">📅</span>
                     <span>{selectedPoint.fullDate.split(' ')[0]}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-4 h-4 flex items-center justify-center opacity-70">🕒</span>
                     <span>{selectedPoint.fullDate.split(' ')[1]}</span>
                   </div>
                 </div>

                 {/* Note Label */}
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
                   笔记 / 评论
                 </div>

                 {/* Note Content Card */}
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 min-h-[120px]">
                   <p className="text-slate-600 leading-relaxed text-base font-sans whitespace-pre-wrap">
                     {selectedPoint.note || selectedPoint.originalRecord?.note || "未添加详细描述..."}
                   </p>
                 </div>
                 
                 {/* Word Count (Optional Detail) */}
                 <div className="text-right mt-3 text-xs text-slate-300 font-mono">
                   {(selectedPoint.note || selectedPoint.originalRecord?.note || "").length}/300
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportVisualization;