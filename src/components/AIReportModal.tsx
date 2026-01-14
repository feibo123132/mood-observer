import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Brain, Quote, RefreshCw } from 'lucide-react';
// @ts-ignore
import { app } from '../lib/cloudbase';
import { useMoodStore } from '../store/useMoodStore';

interface AIReportModalProps {
  moodScores: number[];
  notes: string[];
  weekNumber: number;
  year: number;
  onClose: () => void;
}

type AnalysisStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error' | 'view';

export const AIReportModal = ({ moodScores, notes, weekNumber, year, onClose }: AIReportModalProps) => {
  const { saveReport, deleteReport, reports } = useMoodStore();
  const reportKey = `${year}-${weekNumber}`;
  const savedReport = reports[reportKey];

  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [fullReport, setFullReport] = useState<string>('');
  const [displayedReport, setDisplayedReport] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Typewriter effect refs
  const timerRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    if (savedReport) {
      setFullReport(savedReport);
      setDisplayedReport(savedReport);
      setStatus('view');
    } else {
      // Auto-start analysis if not saved
      handleAnalyze();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // Run once on mount

  // Typewriter effect logic
  useEffect(() => {
    if (status === 'streaming' && fullReport) {
      setDisplayedReport('');
      let currentIndex = 0;
      
      timerRef.current = setInterval(() => {
        setDisplayedReport((prev) => {
          const nextIndex = prev.length + 1;
          if (nextIndex >= fullReport.length) {
            clearInterval(timerRef.current);
            setStatus('done');
            return fullReport;
          }
          return fullReport.slice(0, nextIndex);
        });
      }, 30);

      return () => clearInterval(timerRef.current);
    }
  }, [status, fullReport]);

  const handleAnalyze = async () => {
    if (moodScores.length === 0) {
      setErrorMsg('本周暂无数据，无法进行分析');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      if (!app) {
        throw new Error('CloudBase app instance not found.');
      }

      console.log('Calling analyzeMood...');
      const res = await app.callFunction({
        name: 'analyzeMood',
        data: { moodScores, notes }
      });

      if (res.result && res.result.success) {
        setFullReport(res.result.report);
        setStatus('streaming');
      } else {
        throw new Error(res.result?.error || '分析失败');
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || '连接云端服务失败');
      setStatus('error');
    }
  };

  const handleSave = () => {
    saveReport(year, weekNumber, fullReport);
    setStatus('view'); // Switch to view mode to show delete button
    // Optional: Add toast notification
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这份情绪报告吗？')) {
      deleteReport(year, weekNumber);
      onClose(); // Close modal after delete
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Brain size={18} />
              </div>
              <h3 className="font-bold text-slate-800">情绪咨询师</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {status === 'loading' ? (
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-2 text-indigo-600 mb-6">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm font-medium">AI 正在阅读您的日记...</span>
                </div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-8">
                <div className="inline-flex p-3 bg-red-50 text-red-500 rounded-full mb-3">
                  <Brain size={24} />
                </div>
                <p className="text-slate-600 mb-4">{errorMsg}</p>
                <button 
                  onClick={handleAnalyze}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  重试
                </button>
              </div>
            ) : (
              <div className="prose prose-sm prose-slate max-w-none">
                <div className="relative pl-4 border-l-2 border-indigo-200">
                  <Quote size={16} className="absolute -top-1 -left-2.5 text-indigo-400 bg-white" />
                  <div className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {displayedReport}
                    {status === 'streaming' && (
                      <span className="inline-block w-1.5 h-5 bg-indigo-500 ml-1 align-middle animate-pulse" />
                    )}
                  </div>
                </div>
                
                {(status === 'done' || status === 'view') && (
                  <div className="mt-6 flex justify-end">
                    <span className="text-[10px] text-slate-300">由 DeepSeek 提供分析支持</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {(status === 'done' || status === 'view') && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              {status === 'view' ? (
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm border border-transparent hover:border-red-100"
                >
                  <Trash2 size={16} />
                  删除报告
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-medium text-sm"
                >
                  关闭
                </button>
              )}
              
              {status === 'done' && (
                <button
                  onClick={handleSave}
                  className="flex-[2] py-2.5 flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium text-sm shadow-md"
                >
                  <Save size={16} />
                  保存报告
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
