import { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, RefreshCw, Quote } from 'lucide-react';
// @ts-ignore
import { app } from '../lib/cloudbase';

interface AIReportCardProps {
  moodScores: number[];
  notes: string[];
  weekNumber: number;
}

type AnalysisStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export const AIReportCard = ({ moodScores, notes, weekNumber }: AIReportCardProps) => {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [fullReport, setFullReport] = useState<string>('');
  const [displayedReport, setDisplayedReport] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Typewriter effect refs
  const indexRef = useRef(0);
  const timerRef = useRef<any>(null);

  // Reset state when week changes
  useEffect(() => {
    setStatus('idle');
    setFullReport('');
    setDisplayedReport('');
    setErrorMsg('');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [weekNumber]);

  // Typewriter effect logic
  useEffect(() => {
    if (status === 'streaming' && fullReport) {
      timerRef.current = setInterval(() => {
        setDisplayedReport((prev) => {
          const nextIndex = prev.length + 1;
          if (nextIndex >= fullReport.length) {
            clearInterval(timerRef.current);
            setStatus('done');
            return fullReport;
          }
          // Randomize typing speed slightly for realism
          return fullReport.slice(0, nextIndex);
        });
      }, 30); // 30ms per char

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
        throw new Error('CloudBase app instance not found. Please check src/lib/cloudbase.ts');
      }

      console.log('Calling analyzeMood with:', { moodScores, notes });
      
      const res = await app.callFunction({
        name: 'analyzeMood',
        data: {
          moodScores,
          notes
        }
      });

      console.log('Analyze result:', res);

      if (res.result && res.result.success) {
        setFullReport(res.result.report);
        setDisplayedReport('');
        indexRef.current = 0;
        setStatus('streaming');
      } else {
        throw new Error(res.result?.error || '分析失败，请稍后重试');
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || '连接云端服务失败');
      setStatus('error');
    }
  };

  // Render Logic
  if (status === 'idle') {
    return (
      <div className="mb-6">
        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-0.5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12 -ml-4 w-1/2 h-full" />
          <div className="bg-white/10 backdrop-blur-sm rounded-[10px] px-4 py-3 flex items-center justify-center gap-2">
            <Sparkles size={18} className="animate-pulse" />
            <span className="font-medium text-sm">生成本周 AI 深度情绪报告</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Brain size={100} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${status === 'error' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
            {status === 'loading' ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : status === 'error' ? (
              <Brain size={18} />
            ) : (
              <Brain size={18} />
            )}
          </div>
          <h3 className="font-bold text-slate-700">情绪咨询师</h3>
          {status === 'loading' && (
            <span className="text-xs text-slate-400 animate-pulse">正在阅读您的记录...</span>
          )}
        </div>

        {status === 'loading' ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          </div>
        ) : status === 'error' ? (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
            {errorMsg}
            <button 
              onClick={() => setStatus('idle')}
              className="ml-2 text-red-700 underline text-xs"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="prose prose-sm prose-slate max-w-none">
            <div className="relative pl-4 border-l-2 border-indigo-200">
              <Quote size={16} className="absolute -top-1 -left-2.5 text-indigo-400 bg-white" />
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {displayedReport}
                {status === 'streaming' && (
                  <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-1 align-middle animate-pulse" />
                )}
              </div>
            </div>
            
            {status === 'done' && (
              <div className="mt-4 flex justify-end">
                <span className="text-[10px] text-slate-300">由 DeepSeek 提供分析支持</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
