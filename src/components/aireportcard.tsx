import { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Calendar, FileText, Settings, Send, ChevronRight } from 'lucide-react';
import { useMoodStore } from '../store/useMoodStore';
import { AIReportModal } from './AIReportModal';
import { CustomPromptModal } from './CustomPromptModal';
import { motion, AnimatePresence } from 'framer-motion';

interface AIReportCardProps {
  moodScores: number[];
  notes: string[];
  weekNumber: number;
  year: number;
}

export const AIReportCard = ({ moodScores, notes, weekNumber, year }: AIReportCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'time' | 'custom'>('none');
  const [isCustomPromptModalOpen, setIsCustomPromptModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setActiveMenu('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    setCustomPrompt(''); // Reset custom prompt for standard generation
    setIsModalOpen(true);
  };

  const handleCustomPrompt = (prompt: string) => {
    setCustomPrompt(prompt);
    setIsModalOpen(true);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isDropdownOpen) setActiveMenu('none');
  };

  return (
    <div className="mb-6 relative z-20">
      <div className="flex gap-2">
        {/* Main Action Button */}
        <button
          onClick={handleGenerate}
          className="flex-1 p-0.5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12 -ml-4 w-1/2 h-full" />
          
          <div className="backdrop-blur-sm rounded-[10px] px-4 py-3 flex items-center justify-center gap-2 bg-white/10 text-white">
            <Sparkles size={18} className="animate-pulse" />
            <span className="font-medium text-sm">生成情绪报告</span>
          </div>
        </button>

        {/* Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="h-full px-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
          >
            <ChevronDown 
              size={20} 
              className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30"
              >
                <div className="p-2 space-y-1">
                  {/* Category: Time Range */}
                  <div>
                    <button
                      onClick={() => setActiveMenu(activeMenu === 'time' ? 'none' : 'time')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeMenu === 'time' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="font-medium">选择时间范围</span>
                      </div>
                      <ChevronRight size={14} className={`transition-transform duration-200 ${activeMenu === 'time' ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {/* Submenu for Time Range */}
                    <AnimatePresence>
                      {activeMenu === 'time' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4 border-l border-indigo-100 pl-2 mt-1 space-y-1"
                        >
                          {[
                            { label: '周报 (本周)', active: true },
                            { label: '月报 (本月)', active: false },
                            { label: '季报 (本季)', active: false },
                            { label: '年报 (本年)', active: false },
                          ].map((item) => (
                            <button
                              key={item.label}
                              disabled={!item.active}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                item.active
                                  ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                                  : 'text-slate-300 cursor-not-allowed'
                              }`}
                              onClick={() => {
                                if (item.active) {
                                  handleGenerate();
                                  setIsDropdownOpen(false);
                                }
                              }}
                            >
                              {item.label}
                              {!item.active && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-400">DEV</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category: Custom Report */}
                  <div>
                    <button
                      onClick={() => {
                        setIsCustomPromptModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={16} />
                        <span className="font-medium">情绪魔法师JIEYOU</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Report Modal */}
      {isModalOpen && (
        <AIReportModal
          moodScores={moodScores}
          notes={notes}
          weekNumber={weekNumber}
          year={year}
          customPrompt={customPrompt || undefined}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Custom Prompt Modal */}
      <CustomPromptModal 
        isOpen={isCustomPromptModalOpen}
        onClose={() => setIsCustomPromptModalOpen(false)}
        onConfirm={handleCustomPrompt}
      />
    </div>
  );
};

