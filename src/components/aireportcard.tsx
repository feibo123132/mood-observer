import { useState } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { useMoodStore } from '../store/useMoodStore';
import { AIReportModal } from './AIReportModal';

interface AIReportCardProps {
  moodScores: number[];
  notes: string[];
  weekNumber: number;
  year: number;
}

export const AIReportCard = ({ moodScores, notes, weekNumber, year }: AIReportCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { reports } = useMoodStore();
  
  const reportKey = `${year}-${weekNumber}`;
  const hasSavedReport = !!reports[reportKey];

  return (
    <div className="mb-6">
      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`w-full p-0.5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative ${
          hasSavedReport 
            ? 'bg-slate-200' 
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
        }`}
      >
        {!hasSavedReport && (
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12 -ml-4 w-1/2 h-full" />
        )}
        
        <div className={`backdrop-blur-sm rounded-[10px] px-4 py-3 flex items-center justify-center gap-2 ${
          hasSavedReport 
            ? 'bg-white text-slate-700' 
            : 'bg-white/10 text-white'
        }`}>
          {hasSavedReport ? (
            <>
              <FileText size={18} className="text-indigo-500" />
              <span className="font-medium text-sm">查看本周情绪报告</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="animate-pulse" />
              <span className="font-medium text-sm">生成本周 AI 深度情绪报告</span>
            </>
          )}
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <AIReportModal
          moodScores={moodScores}
          notes={notes}
          weekNumber={weekNumber}
          year={year}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
