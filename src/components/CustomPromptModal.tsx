import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface CustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (prompt: string) => void;
}

export const CustomPromptModal = ({ isOpen, onClose, onConfirm }: CustomPromptModalProps) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onConfirm(prompt);
      setPrompt(''); // Clear after sending
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-indigo-100"
          >
            {/* Header with Magic Theme */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Sparkles size={60} />
              </div>
              
              <div className="relative z-10 flex items-center gap-3 mb-1">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-xl font-bold">情绪魔法师JIEYOU</h3>
              </div>
              <p className="text-indigo-100 text-sm pl-12 opacity-90">
                输入咒语，让 魔法师JIEYOU 用你喜欢的方式和情绪互动
              </p>

              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-50 group"
              >
                <div className="absolute inset-0 -m-2 rounded-full" /> {/* Invisible larger touch area */}
                <X size={20} className="relative z-10 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请输入您的自定义指令...&#10;&#10;例如：&#10;“请用鲁迅的口吻讽刺我这周的颓废状态”&#10;“像一位温柔的邻家大姐姐一样安慰我”&#10;“用塔罗牌师的神秘语气解读我的运势”"
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 text-slate-700 text-sm leading-relaxed placeholder:text-slate-400 transition-all"
                  autoFocus
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-300 pointer-events-none">
                  {prompt.length} 字
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="flex-[2] py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Sparkles size={16} />
                  开始施法
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
