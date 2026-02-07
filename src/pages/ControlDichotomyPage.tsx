import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GripVertical, Trash2, Save, ArrowRight, ArrowLeft as ArrowLeftIcon, Check } from 'lucide-react';
import { useControlStore } from '../store/useControlStore';
import { ControlItem } from '../types';

export const ControlDichotomyPage = () => {
  const navigate = useNavigate();
  const { addRecord } = useControlStore();
  
  const [step, setStep] = useState<'input' | 'split' | 'result'>('input');
  const [challenge, setChallenge] = useState('');
  const [currentItemText, setCurrentItemText] = useState('');
  const [items, setItems] = useState<ControlItem[]>([]);

  // Step 1: Input Challenge
  const handleStart = () => {
    if (!challenge.trim()) return;
    setStep('split');
  };

  // Step 2: Add Item
  const handleAddItem = (type: 'controllable' | 'uncontrollable') => {
    if (!currentItemText.trim()) return;
    
    const newItem: ControlItem = {
      id: crypto.randomUUID(),
      text: currentItemText,
      type
    };
    
    setItems(prev => [...prev, newItem]);
    setCurrentItemText('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleFinish = async () => {
    await addRecord({
      challenge,
      items,
      summary: '请赐予我力量，去改变我所能改变的；赐予我勇气，去接受我不能改变的；并赐予我智慧，去分辨这两者的区别。'
    });
    navigate('/treasure-box/control-history');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-md p-6 flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/treasure-box')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-medium text-slate-800">控制二分法</span>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col px-6 pb-8">
        
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-4">最近有什么困扰？</h2>
              <p className="text-slate-500 mb-8">写下那件让你感到压力、焦虑或愤怒的事情。</p>
              
              <textarea
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="例如：明天的演讲让我很紧张，担心观众不喜欢..."
                className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-48 mb-8 text-slate-700"
                autoFocus
              />

              <button
                onClick={handleStart}
                disabled={!challenge.trim()}
                className="w-full py-4 rounded-xl bg-purple-600 text-white font-medium shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                开始拆解
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 'split' && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-400 mb-1">当前挑战</h3>
                <p className="text-slate-700 font-medium line-clamp-2">{challenge}</p>
              </div>

              {/* Split Zone */}
              <div className="flex-1 flex gap-2 mb-6 min-h-0">
                {/* Uncontrollable Zone */}
                <div className="flex-1 bg-slate-100 rounded-2xl p-3 flex flex-col overflow-hidden border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 text-center mb-3">不可控 (外部)</div>
                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                    <AnimatePresence>
                      {items.filter(i => i.type === 'uncontrollable').map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="bg-white/50 p-3 rounded-xl text-sm text-slate-600 relative group"
                        >
                          {item.text}
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="absolute right-1 top-1 p-1 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Controllable Zone */}
                <div className="flex-1 bg-green-50 rounded-2xl p-3 flex flex-col overflow-hidden border border-green-100">
                  <div className="text-xs font-bold text-green-600 text-center mb-3">可控 (内部)</div>
                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                    <AnimatePresence>
                      {items.filter(i => i.type === 'controllable').map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="bg-white p-3 rounded-xl text-sm text-slate-800 shadow-sm border border-green-100 relative group"
                        >
                          {item.text}
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="absolute right-1 top-1 p-1 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <input
                  value={currentItemText}
                  onChange={(e) => setCurrentItemText(e.target.value)}
                  placeholder="输入一个细分因素..."
                  className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      // Maybe shortcut?
                    }
                  }}
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddItem('uncontrollable')}
                    disabled={!currentItemText.trim()}
                    className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeftIcon size={16} />
                    丢给命运
                  </button>
                  <button
                    onClick={() => handleAddItem('controllable')}
                    disabled={!currentItemText.trim()}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    我来掌控
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep('result')}
                    disabled={items.length === 0}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    完成拆解，查看真相
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">颗粒归仓</h2>
                <p className="text-sm text-slate-500">已剥离 {items.filter(i => i.type === 'uncontrollable').length} 项干扰，聚焦 {items.filter(i => i.type === 'controllable').length} 项行动</p>
              </div>

              <div className="flex-1 relative mb-8">
                {/* Background Layer - Uncontrollable (Blurred/Faded) */}
                <div className="absolute inset-0 p-4 flex flex-wrap content-start gap-2 opacity-30 pointer-events-none grayscale blur-[1px]">
                   {items.filter(i => i.type === 'uncontrollable').map(item => (
                     <span key={item.id} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs">
                       {item.text}
                     </span>
                   ))}
                </div>

                {/* Foreground Layer - Controllable (Highlighted) */}
                <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-purple-100 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold">
                    <Check size={20} />
                    <span>全力以赴</span>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {items.filter(i => i.type === 'controllable').map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <span className="text-slate-800 font-medium leading-relaxed">{item.text}</span>
                      </motion.div>
                    ))}
                    {items.filter(i => i.type === 'controllable').length === 0 && (
                      <p className="text-slate-400 text-sm italic">似乎没有什么是你能控制的？再仔细想想，你的态度、你的反应...</p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-400 italic text-center leading-relaxed">
                      "请赐予我力量，去改变我所能改变的；<br/>
                      赐予我勇气，去接受我不能改变的；<br/>
                      并赐予我智慧，去分辨这两者的区别。"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                 <button
                    onClick={() => setStep('split')}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    继续调整
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    保存并结束
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
