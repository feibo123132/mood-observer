import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, History, ChevronRight, ChevronDown, Plus, FileText } from 'lucide-react';
import { useSurgeryStore } from '../store/useSurgeryStore';

export const TreasureBoxPage = () => {
  const navigate = useNavigate();
  const { records } = useSurgeryStore();
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
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Sparkles size={80} className="text-purple-500" />
              </div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">烦恼手术</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    化身苏格拉底，对自己进行一场理性的拷问。<br/>
                    <span className="text-xs text-purple-500 mt-2 inline-block">6步思维重塑 • CBT认知疗法</span>
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
                          <span className="block font-medium text-slate-800">烦恼手术室</span>
                          <span className="text-xs text-slate-500">开始一次新的思维清理</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-purple-300 group-hover:text-purple-500 transition-colors" />
                    </button>

                    {/* Action Button: History (New Design) */}
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
                          <span className="block font-medium text-slate-800">手术记录本</span>
                          <span className="text-xs text-slate-500">
                            查看过往的思维重塑 ({records.length})
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
