import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Force refresh
import { ArrowLeft, Clock, ChevronDown, ChevronLeft, ChevronRight, FileText, Trees, BookOpen } from 'lucide-react';
import { useMoodStore } from '../store/useMoodStore';
import { useMoodStats, SortType } from '../hooks/useMoodStats';
import { format, getYear } from 'date-fns';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { RecordEditModal } from '../components/RecordEditModal';
import { MoodRecord } from '../types';
import { getQuarterWeeks, QuarterInfo, WeekInfo } from '../utils/dateUtils';
import { AIReportCard } from '../components/AIReportCard';

export const ReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const allRecords = useMoodStore((state) => state.records);
  const [activeTab, setActiveTab] = useState<'overall' | 'weekly'>(() => (location.state as any)?.activeTab || 'overall');
  const [sortBy, setSortBy] = useState<SortType>('score_desc');
  const [editingRecord, setEditingRecord] = useState<MoodRecord | null>(null);
  const [isMoodDistributionOpen, setIsMoodDistributionOpen] = useState(false);
  const [isHarvestDistributionOpen, setIsHarvestDistributionOpen] = useState(false);

  // Year State
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Quarter & Week State
  const [quarters, setQuarters] = useState<QuarterInfo[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState<number>(1);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const weekButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Collapse State for Week Selector
  const [isWeekSelectorOpen, setIsWeekSelectorOpen] = useState(false);
  // Removed unused reports and hasReports variables since icon is always shown

  // Initialize quarters when year changes
  useEffect(() => {
    const qs = getQuarterWeeks(selectedYear);
    setQuarters(qs);
    
    // Auto-select current quarter and week if in current year
    if (selectedYear === currentYear) {
      const now = new Date();
      // Find the week that contains today
      let found = false;
      for (const q of qs) {
        for (const w of q.weeks) {
          // Check if today is within this week's range (start <= now <= end)
          // We compare timestamps to be safe
          if (now.getTime() >= w.start.getTime() && now.getTime() <= w.end.getTime()) {
            setSelectedQuarterId(q.id);
            setSelectedWeekId(w.id);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      
      // Fallback: if not found (maybe edge case), select current quarter based on month
      if (!found) {
        const qId = Math.floor(now.getMonth() / 3) + 1;
        setSelectedQuarterId(qId);
      }
    } else {
      setSelectedQuarterId(1);
    }
  }, [selectedYear, currentYear]);

  // Set default week when quarter changes
  useEffect(() => {
    const quarter = quarters.find(q => q.id === selectedQuarterId);
    if (!quarter) return;

    // Check if currently selected week is in the new quarter
    const isWeekInQuarter = quarter.weeks.some(w => w.id === selectedWeekId);
    
    // Only auto-select if current selection is invalid for this quarter
    if (!isWeekInQuarter && quarter.weeks.length > 0) {
      // Default to the last week in the quarter (most recent)
      setSelectedWeekId(quarter.weeks[quarter.weeks.length - 1].id);
    } else if (quarter.weeks.length === 0) {
      setSelectedWeekId(null);
    }
  }, [selectedQuarterId, quarters]);

  // Auto-scroll week list to the currently selected week when selector opens
  useEffect(() => {
    if (!isWeekSelectorOpen || !selectedWeekId) return;
    const target = weekButtonRefs.current[selectedWeekId];
    if (!target) return;
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }, [isWeekSelectorOpen, selectedWeekId, selectedQuarterId, quarters]);

  // Derived state for selected week info
  const selectedWeek = useMemo(() => {
    for (const q of quarters) {
      for (const w of q.weeks) {
        if (w.id === selectedWeekId) return w;
      }
    }
    return null;
  }, [quarters, selectedWeekId]);

  // Pass date range to hook
  const dateRange = useMemo(() => {
    if (activeTab === 'weekly' && selectedWeek) {
      return { start: selectedWeek.start, end: selectedWeek.end };
    }
    return null;
  }, [activeTab, selectedWeek]);
  
  const { moodDistribution, harvestDistribution, weeklyRecords } = useMoodStats({ 
    sortBy, 
    dateRange 
  });
  const allActiveRecords = useMemo(() => allRecords.filter((record) => !record.deletedAt), [allRecords]);

  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const [isMoodExpanded, setIsMoodExpanded] = useState(true);
  const [isHarvestExpanded, setIsHarvestExpanded] = useState(true);

  // Filter records by type
  const moodRecords = weeklyRecords.filter(r => (r.type || 'mood') === 'mood');
  const harvestRecords = weeklyRecords.filter(r => r.type === 'harvest');

  // Helper to render record card
  const renderRecordCard = (record: MoodRecord) => {
    const isHarvest = record.type === 'harvest';
    const state = isHarvest ? getHarvestLevel(record.score) : getMoodState(record.score);
    
    return (
      <div 
        key={record.id} 
        onClick={() => setEditingRecord(record)}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono">
              {format(new Date(record.timestamp), 'MM-dd HH:mm')}
            </span>
            <span className="text-sm font-bold text-slate-800 mt-0.5">
              {state.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              编辑
            </span>
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: state.color }}
            >
              {record.score}
            </span>
          </div>
        </div>
        {record.note && (
          <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-2 mt-2">
            {record.note}
          </p>
        )}
      </div>
    );
  };

  // Helper to render distribution item with expansion
  const renderDistributionItem = (item: any, maxCount: number) => {
    const isExpanded = expandedLabel === item.label;
    
    return (
      <div key={item.label} className="space-y-2">
        <div 
          onClick={() => setExpandedLabel(isExpanded ? null : item.label)}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full shadow-sm ring-2 ring-slate-50"
              style={{ background: item.color }}
            />
            <span className="text-slate-700 font-medium">{item.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full opacity-60"
                  style={{ 
                    width: `${(item.count / maxCount) * 100}%`,
                    background: item.color 
                  }} 
                />
              </div>
              <span className="text-sm font-bold text-slate-400 w-8 text-right">
                {item.count}
              </span>
            </div>
            <ChevronRight 
              size={16} 
              className={`text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && item.records && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pl-4"
            >
              <div className="space-y-3 border-l-2 border-slate-100 pl-4 py-2">
                {item.records.map(renderRecordCard)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between sticky top-0 bg-slate-50 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">情绪回顾</span>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="w-full max-w-md px-6 mb-6">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100 flex relative">
          <button
            onClick={() => setActiveTab('overall')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'overall' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            总回顾
          </button>
          
          {/* Year Picker / Weekly Tab Button */}
          <div className="flex-1 relative">
            <button
              onClick={() => {
                if (activeTab === 'weekly') {
                  setIsYearPickerOpen(!isYearPickerOpen);
                } else {
                  setActiveTab('weekly');
                }
              }}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'weekly' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              周回顾
              {activeTab === 'weekly' && <ChevronDown size={14} className={`transition-transform ${isYearPickerOpen ? 'rotate-180' : ''}`} />}
            </button>

            {/* Year Dropdown */}
            {isYearPickerOpen && activeTab === 'weekly' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-slate-800">{selectedYear}</span>
                <button 
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 pb-20 flex-1 overflow-y-auto">
        {activeTab === 'overall' ? (
          /* Overall Review Tab */
          <div className="space-y-8">
            
            {/* Mood Forest Distribution */}
            <div>
              <button
                type="button"
                onClick={() => setIsMoodDistributionOpen((v) => !v)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-2">
                  <Trees size={18} className="text-green-600" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    情绪之森 ({moodDistribution.reduce((acc, curr) => acc + curr.count, 0)}条记录)
                  </h3>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-300 transition-transform duration-300 ${isMoodDistributionOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isMoodDistributionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {moodDistribution.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-light text-sm bg-white rounded-xl border border-dashed border-slate-100">
                        暂无情绪记录
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {moodDistribution.map((item) => renderDistributionItem(item, moodDistribution[0].count))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Treasure Journey Distribution */}
            <div>
              <button
                type="button"
                onClick={() => setIsHarvestDistributionOpen((v) => !v)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    宝藏之旅 ({harvestDistribution.reduce((acc, curr) => acc + curr.count, 0)}条记录)
                  </h3>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-300 transition-transform duration-300 ${isHarvestDistributionOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isHarvestDistributionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {harvestDistribution.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-light text-sm bg-white rounded-xl border border-dashed border-slate-100">
                        暂无宝藏记录
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {harvestDistribution.map((item) => renderDistributionItem(item, harvestDistribution[0].count))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        ) : (
          /* Weekly Review Tab */
          <div className="space-y-6">
            {/* Sort Controls (Header) */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setIsWeekSelectorOpen(!isWeekSelectorOpen)}
                className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-slate-600 transition-colors"
              >
                {selectedWeek ? `第${selectedWeek.weekNumber}周记录` : '本周记录'} ({weeklyRecords.length})
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${isWeekSelectorOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate('/reports')}
                  className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                  title="查看已保存的情绪报告"
                >
                  <FileText size={16} />
                </button>
                <button 
                  onClick={() => setSortBy('time')}
                  className={`p-1.5 rounded-lg transition-colors ${sortBy === 'time' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="按时间排序"
                >
                  <Clock size={16} />
                </button>
                <button 
                  onClick={() => setSortBy(sortBy === 'score_desc' ? 'score_asc' : 'score_desc')}
                  className={`p-1.5 rounded-lg transition-colors ${sortBy.startsWith('score') ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                  title="按分数排序"
                >
                  <div className="flex items-center gap-1">
                    <BarChart2 size={16} className={sortBy === 'score_asc' ? 'rotate-180' : ''} />
                    {sortBy.startsWith('score') && (
                      <span className="text-[10px] font-bold">{sortBy === 'score_desc' ? '高→低' : '低→高'}</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Collapsible Week Selector */}
            <AnimatePresence>
              {isWeekSelectorOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  className="overflow-hidden space-y-6"
                >
                  {/* Quarter Selector */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {quarters.map(q => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuarterId(q.id)}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          selectedQuarterId === q.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  {/* Week Horizontal Scroll */}
                  <div className="flex overflow-x-auto gap-3 pb-2 -mx-6 px-6 scrollbar-thin">
                    <style>{`
                      .scrollbar-thin::-webkit-scrollbar {
                        height: 4px;
                      }
                      .scrollbar-thin::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .scrollbar-thin::-webkit-scrollbar-thumb {
                        background-color: #cbd5e1;
                        border-radius: 20px;
                      }
                    `}</style>
                    {quarters.find(q => q.id === selectedQuarterId)?.weeks.map(week => (
                      <button
                        key={week.id}
                        ref={(el) => {
                          weekButtonRefs.current[week.id] = el;
                        }}
                        onClick={() => setSelectedWeekId(week.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border flex flex-col items-center justify-center min-w-[80px] ${
                          selectedWeekId === week.id
                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm h-auto'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 h-[38px]'
                        }`}
                      >
                        <div className="font-bold">第{week.weekNumber}周</div>
                        {selectedWeekId === week.id && (
                          <div className="opacity-80 scale-90 mt-0.5">{format(week.start, 'M.d')}-{format(week.end, 'M.d')}</div>
                        )}
                      </button>
                    ))}
                    {quarters.find(q => q.id === selectedQuarterId)?.weeks.length === 0 && (
                       <div className="text-xs text-slate-400 py-2">该季度暂无周数据</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Analysis Card */}
            {selectedWeek && allActiveRecords.length > 0 && (
              <AIReportCard 
                moodScores={weeklyRecords.map(r => r.score)} 
                notes={weeklyRecords.map(r => r.note || '')}
                types={weeklyRecords.map(r => r.type || 'mood')}
                allMoodScores={allActiveRecords.map((r) => r.score)}
                allNotes={allActiveRecords.map((r) => r.note || '')}
                allTypes={allActiveRecords.map((r) => r.type || 'mood')}
                weekNumber={selectedWeek.weekNumber}
                year={selectedYear}
              />
            )}

            {weeklyRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-light bg-white rounded-2xl border border-slate-100 border-dashed">
                该时段暂无记录
              </div>
            ) : (
              <div className="space-y-4">
                  
                {/* Mood Forest Section */}
                <div className="space-y-2">
                    <button 
                      onClick={() => setIsMoodExpanded(!isMoodExpanded)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transform transition-transform duration-200 ${isMoodExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight size={16} className="text-slate-400" />
                        </span>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Trees size={18} className="text-green-600" />
                          <span>情绪之森</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {moodRecords.length}
                      </span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isMoodExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {moodRecords.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-light text-sm bg-white rounded-xl border border-dashed border-slate-100 ml-2">
                              暂无情绪记录
                            </div>
                          ) : (
                            <div className="space-y-3 pl-2">
                              {moodRecords.map(renderRecordCard)}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>

                {/* Treasure Journey Section */}
                <div className="space-y-2">
                    <button 
                      onClick={() => setIsHarvestExpanded(!isHarvestExpanded)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transform transition-transform duration-200 ${isHarvestExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight size={16} className="text-slate-400" />
                        </span>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <BookOpen size={18} className="text-amber-500" />
                          <span>宝藏之旅</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {harvestRecords.length}
                      </span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isHarvestExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {harvestRecords.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 font-light text-sm bg-white rounded-xl border border-dashed border-slate-100 ml-2">
                              暂无宝藏记录
                            </div>
                          ) : (
                            <div className="space-y-3 pl-2">
                              {harvestRecords.map(renderRecordCard)}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <RecordEditModal 
        record={editingRecord} 
        onClose={() => setEditingRecord(null)} 
      />
    </div>
  );
};


// Icon helper since lucide-react BarChart2 is used
function BarChart2({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}
