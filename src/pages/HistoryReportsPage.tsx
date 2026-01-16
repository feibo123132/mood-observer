import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, FileText, Brain } from 'lucide-react';
import { useMoodStore } from '../store/useMoodStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const HistoryReportsPage = () => {
  const navigate = useNavigate();
  const { reports, deleteReport } = useMoodStore();
  const [selectedReport, setSelectedReport] = useState<{key: string, content: string} | null>(null);

  // Parse report keys (year-week) and sort by date descending
  const sortedReports = Object.entries(reports)
    .map(([key, content]) => {
      const [year, week] = key.split('-').map(Number);
      return { key, year, week, content };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

  const handleDelete = (e: React.MouseEvent, year: number, week: number) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这份情绪报告吗？')) {
      deleteReport(year, week);
      if (selectedReport?.key === `${year}-${week}`) {
        setSelectedReport(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">历史情绪报告</span>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md px-6 pb-20 flex-1 overflow-y-auto">
        {sortedReports.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-light flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <FileText size={32} />
            </div>
            <span>暂无已保存的报告</span>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReports.map((report) => (
              <motion.div
                key={report.key}
                layoutId={report.key}
                onClick={() => setSelectedReport({ key: report.key, content: report.content })}
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Brain size={60} />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700">第 {report.week} 周情绪报告</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Calendar size={12} />
                        {report.year}年
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, report.year, report.week)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p className="mt-4 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {report.content}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            
            <motion.div
              layoutId={selectedReport.key}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">报告详情</h3>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft size={20} className="text-slate-500" />
                  </button>
               </div>

              <div className="p-6 overflow-y-auto">
                <div className="prose prose-sm prose-slate max-w-none">
                  <div className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedReport.content}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
