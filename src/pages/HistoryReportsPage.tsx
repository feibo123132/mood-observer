import { useState, useMemo } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { format, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FileText, ArrowLeft, Calendar, Trash2, Brain, PanelRight, Volume2, PieChart, Loader2, X, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { app } from '../lib/cloudbase';
import ReportVisualization from '../components/ReportVisualization';

export const HistoryReportsPage = () => {
  const navigate = useNavigate();
  const { reports, deleteReport } = useMoodStore();
  const [selectedReport, setSelectedReport] = useState<{key: string, content: string, date: string, year: number, week: number} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [retryMode, setRetryMode] = useState(false);

  // New states for Content Visualization
  const [isDesigning, setIsDesigning] = useState(false);
  const [designRetryMode, setDesignRetryMode] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const handleGeneratePodcast = async (content: string, year: number, week: number) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // 1. Mandatory Auth Check
      await app.auth().signInAnonymously();
      
      // 2. Call Cloud Function
      const res = await app.callFunction({
        name: 'generatePodcast',
        data: { text: content, year, week }
      });

      // @ts-ignore
      if (res.result?.success && res.result?.audioUrl) {
        // @ts-ignore
        setAudioUrl(res.result.audioUrl);
        setRetryMode(false);
      } else {
        // @ts-ignore
        alert('生成失败: ' + (res.result?.error || '未知错误'));
      }
    } catch (error: any) {
      console.error('Podcast generation failed:', error);
      let errorMsg = error.message || '未知错误';
      
      // Handle Timeout / Network Error (504)
      if (errorMsg.includes('timeout') || errorMsg.includes('network') || errorMsg.includes('504')) {
        setRetryMode(true);
        alert('请求超时（后台仍在运行），请稍等片刻后点击“点击获取结果”按钮即可播放。');
      } else {
        alert('生成出错: ' + errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDesignReport = async (content: string, year: number, week: number) => {
    if (isDesigning) return;
    setIsDesigning(true);
    try {
      await app.auth().signInAnonymously();

      // If in retry mode, pass checkOnly: true to avoid burning API quota
      const res = await app.callFunction({
        name: 'designReport',
        data: { 
          reportText: content, 
          year, 
          week,
          checkOnly: designRetryMode // Only check DB if we are retrying
        }
      });

      // @ts-ignore
      if (res.result?.success && res.result?.html) {
        // @ts-ignore
        setReportHtml(res.result.html);
        setDesignRetryMode(false);
      } else {
        // Handle "Not Found" specifically for checkOnly mode
        // @ts-ignore
        if (designRetryMode && res.result?.status === 'pending') {
          if (window.confirm('后台仍在生成或已失败，暂未找到结果。\n\n是否重新开始生成？(将消耗API额度)')) {
            setDesignRetryMode(false); // Reset retry mode to force generation next time
            // Ideally we could auto-trigger here, but letting user click again is safer
          }
        } else {
          // @ts-ignore
          alert('生成失败: ' + (res.result?.error || '未知错误'));
        }
      }
    } catch (error: any) {
      console.error('Design generation failed:', error);
      let errorMsg = error.message || '未知错误';

      // Handle Timeout / Network Error (504)
      if (errorMsg.includes('timeout') || errorMsg.includes('network') || errorMsg.includes('504')) {
        setDesignRetryMode(true);
        alert('请求超时（后台仍在运行），请稍等片刻后点击“点击获取结果”按钮即可查看。');
      } else {
        alert('生成出错: ' + errorMsg);
      }
    } finally {
      setIsDesigning(false);
    }
  };

  // Group reports by year and week
  const sortedReports = useMemo(() => {
    return Object.entries(reports)
      .map(([key, content]) => {
        const [year, week] = key.split('-').map(Number);
        return { key, year, week, content, date: `${year}年 第${week}周` };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
      });
  }, [reports]);

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
        <button onClick={() => navigate('/review', { state: { activeTab: 'weekly' } })} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
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
                onClick={() => setSelectedReport(report)}
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] z-10"
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                  {/* Left: Back Button */}
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  
                  {/* Center: Title */}
                  <h3 className="font-bold text-slate-800 text-lg absolute left-1/2 -translate-x-1/2">
                    报告详情
                  </h3>

                  {/* Right: Sidebar Icon */}
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2 rounded-full transition-colors ${isSidebarOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-500'}`}
                  >
                    <PanelRight size={20} />
                  </button>
               </div>

              <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="prose prose-sm prose-slate max-w-none">
                    <div className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedReport.content}
                    </div>
                  </div>
                </div>

                {/* Sidebar Drawer */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-48 border-l border-slate-100 bg-slate-50/80 backdrop-blur-sm p-4 flex flex-col gap-4 z-20 absolute right-0 top-0 bottom-0 shadow-inner"
                    >
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                         智能助手
                       </div>
                       
                       {/* Feature 1: Report Reading */}
                       <button 
                         className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-blue-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                         onClick={() => selectedReport && handleGeneratePodcast(selectedReport.content, selectedReport.year, selectedReport.week)}
                         disabled={isGenerating}
                       >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${retryMode ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600 group-hover:scale-110'}`}>
                           {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                         </div>
                         <div className="flex-1">
                           <div className={`text-sm font-medium ${retryMode ? 'text-orange-600' : 'text-slate-700 group-hover:text-blue-700'}`}>
                             {isGenerating ? '处理中...' : (retryMode ? '点击获取结果' : '双人播客')}
                           </div>
                           <div className="text-[10px] text-slate-400 mt-0.5">
                             {retryMode ? '后台生成中' : '语音播报'}
                           </div>
                         </div>
                       </button>

                       {/* Feature 2: Data Template */}
                       <button 
                         className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-purple-50 transition-all group text-left"
                         onClick={() => selectedReport && navigate(`/report-visualization/${selectedReport.year}/${selectedReport.week}`)}
                       >
                         <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                           <PieChart size={16} />
                         </div>
                         <div className="flex-1">
                           <div className="text-sm font-medium text-slate-700 group-hover:text-purple-700">数据样板</div>
                           <div className="text-[10px] text-slate-400 mt-0.5">图表分析</div>
                         </div>
                       </button>

                       {/* Feature 3: Content Visualization */}
                       <button 
                         className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm hover:shadow-md hover:bg-pink-50 transition-all group text-left disabled:opacity-50"
                         onClick={() => selectedReport && handleDesignReport(selectedReport.content, selectedReport.year, selectedReport.week)}
                         disabled={isDesigning || isGenerating}
                       >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isDesigning ? 'bg-pink-100 text-pink-600' : 'bg-pink-100 text-pink-600 group-hover:scale-110'}`}>
                           {isDesigning ? <Loader2 size={16} className="animate-spin" /> : <LayoutTemplate size={16} />}
                         </div>
                         <div className="flex-1">
                           <div className={`text-sm font-medium ${designRetryMode ? 'text-orange-600' : 'text-slate-700 group-hover:text-pink-700'}`}>
                             {isDesigning ? '设计中...' : (designRetryMode ? '点击获取结果' : '内容可视化')}
                           </div>
                           <div className="text-[10px] text-slate-400 mt-0.5">
                             {isDesigning ? 'AI正在绘图' : (designRetryMode ? '后台生成中' : '创意展示')}
                           </div>
                         </div>
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Player Modal */}
      <AnimatePresence>
        {audioUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAudioUrl(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                     <Volume2 size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">情绪报告播客</h3>
                </div>
                <button 
                  onClick={() => setAudioUrl(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <audio controls autoPlay src={audioUrl} className="w-full" />
              
              <p className="text-xs text-slate-400 mt-4 text-center">
                由豆包语音模型生成
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New: Content Visualization Modal */}
      <AnimatePresence>
        {reportHtml && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportHtml(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                     <LayoutTemplate size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">内容可视化报告</h3>
                </div>
                <button 
                  onClick={() => setReportHtml(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 bg-slate-100 overflow-hidden relative">
                 <iframe 
                   srcDoc={reportHtml}
                   className="w-full h-full border-0"
                   sandbox="allow-scripts allow-same-origin allow-popups"
                   title="Report Visualization"
                 />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
