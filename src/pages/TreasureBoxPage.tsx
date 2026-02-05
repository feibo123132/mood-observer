import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, ChevronRight, ChevronDown, Plus, FileText } from 'lucide-react';
import { useSurgeryStore } from '../store/useSurgeryStore';

export const TreasureBoxPage = () => {
  const navigate = useNavigate();
  // ✅ 修正：使用最新的 Store 变量名 surgeryRecords
  const surgeryRecords = useSurgeryStore((state) => state.records);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const toggleTool = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center gap-4 z-10">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-medium text-slate-800">百宝箱</h1>
      </div>

      <div className="w-full max-w-md px-6 pb-24 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Tools List */}
        <div className="space-y-4">
          
          {/* Tool Card: Trouble Surgery */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 ${
              expandedTool === 'surgery' ? 'ring-2 ring-purple-100' : ''
            }`}
          >
            {/* Card Header (Clickable to Expand) */}
            <div 
              onClick={() => toggleTool('surgery')}
              className="p-6 cursor-pointer relative overflow-hidden group"
            >
              {/* 右侧背景大装饰保持不变 */}
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Sparkles size={80} className="text-purple-500" />
              </div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  {/* ❌ 图标容器已移除，文字将自动向上平移 */}
                  <h3 className="text-lg font-bold text-slate-800 mb-1">心灵按摩铺</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    和苏格拉底一起，在炉边聊聊你的心事<br/>
                    <span className="text-xs text-purple-500 mt-2 inline-block">8步思维重塑 • CBT认知疗法 • 当今最成功、最有效的心灵疗愈</span>
                  </p>
                </div>
                
                <div className="text-slate-300">
                  {expandedTool === 'surgery' ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedTool === 'surgery' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-slate-50"
                >
                  <div className="p-4 space-y-3">
                    {/* Action Button: Start Surgery */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/treasure-box/trouble-surgery');
                      }}
                      className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm">
                          <Plus size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block font-medium text-slate-800">心灵按摩</span>
                          <span className="text-xs text-slate-500">开始一次新的心灵疗愈体验</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-purple-300 group-hover:text-purple-500 transition-colors" />
                    </button>

                    {/* Action Button: History */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/treasure-box/surgery-history');
                      }}
                      className="w-full p-4 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block font-medium text-slate-800">疗愈回顾</span>
                          <span className="text-xs text-slate-500">
                            {/* ✅ 修正：使用 surgeryRecords.length */}
                            查看过往的心灵疗愈记录 ({surgeryRecords.length})
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
};