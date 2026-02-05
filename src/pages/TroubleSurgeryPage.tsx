import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { useSurgeryStore } from '../store/useSurgeryStore';

interface Step {
  id: string;
  title: string;
  question: string;
  placeholder?: string;
  field?: string;
  subQuestions?: { label: string; field: string; placeholder: string }[];
}

const STEPS: Step[] = [
  {
    id: 'intro',
    title: '你的心事',
    question: '发生了什么？你现在的自动思维（最大的烦恼）是什么？',
    // ✅ 已优化：更具共鸣的职场案例
    placeholder: '例如：老板交代的任务没完成好，我觉得自己好失败...',
    field: 'trouble'
  },
  {
    id: 'evidence',
    title: '寻找证据',
    question: '这是事实还是观点？你有确凿证据支持或反驳这个想法？',
    subQuestions: [
      { label: '支持的证据', field: 'evidence_support', placeholder: '有什么事实证明你是对的？（比如：确实错过了截止日期）' },
      { label: '反对的证据', field: 'evidence_against', placeholder: '有什么事实能反驳这个想法？以前有过做得好的时候吗？' }
    ]
  },
  {
    id: 'alternative',
    title: '替代解释',
    question: '除了你想到的这个糟糕原因，还有其他可能性吗？',
    // ✅ 已优化
    placeholder: '例如：也许是任务排期太紧？或者是沟通中存在误解？',
    field: 'alternative'
  },
  {
    id: 'implication',
    title: '评估后果',
    question: '就算这是真的，最坏的结果是什么？你真的无法承受吗？',
    // ✅ 已优化
    placeholder: '例如：最坏的结果是被批评，但我可以承担责任并补救，这不代表我会被开除。',
    field: 'implication'
  },
  {
    id: 'utility',
    title: '效用分析',
    question: '抱着这个想法不放，对你有帮助吗？还是在伤害你？',
    // ✅ 已优化
    placeholder: '例如：这个想法只会让我更焦虑，导致效率降低，无法解决任何实际问题。',
    field: 'utility'
  },
  {
    id: 'distancing',
    title: '旁观者视角',
    question: '如果你的好朋友遇到了同样的事，你会对他/她说什么？',
    // ✅ 已优化
    placeholder: '例如：我会告诉他，谁都有失手的时候，关键是从中学习，而不是彻底否定自己。',
    field: 'distancing'
  },
  {
    id: 'plan',
    title: '行动计划',
    question: '既然想清楚了，下一步你可以做点什么来改变现状？',
    // ✅ 已优化
    placeholder: '例如：深呼吸，列出失败的原因，明天主动找老板复盘并提出补救方案。',
    field: 'plan'
  },
  {
    id: 'summary',
    title: '新的认知',
    question: '经过这番交流，你现在如何看待这件事？请写下一个新的、更理性的想法。',
    // ✅ 已优化
    placeholder: '例如：任务没做好是事实，但这并没有从根本上否定我的价值。',
    field: 'newThought'
  }
];

export const TroubleSurgeryPage = () => {
  const navigate = useNavigate();
  const { addRecord } = useSurgeryStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState<Record<string, string>>({
    trouble: '',
    evidence_support: '',
    evidence_against: '',
    alternative: '',
    implication: '',
    utility: '',
    distancing: '',
    plan: '',
    newThought: ''
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  const handleSave = async () => {
    if (!formData.newThought.trim()) return;

    await addRecord({
      trouble: formData.trouble,
      evidence: {
        support: formData.evidence_support,
        against: formData.evidence_against
      },
      alternative: formData.alternative,
      implication: formData.implication,
      utility: formData.utility,
      distancing: formData.distancing,
      plan: formData.plan,
      newThought: formData.newThought
    });

    navigate('/treasure-box');
  };

  const stepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

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
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-800">心灵按摩铺</span>
          <span className="text-xs text-slate-400">Step {currentStep + 1} / {STEPS.length}</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md px-6 mb-8">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md px-6 flex-1 flex flex-col pb-8 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{stepData.title}</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">{stepData.question}</p>

            <div className="flex-1 space-y-6">
              {stepData.id === 'evidence' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {stepData.subQuestions![0].label}
                    </label>
                    <textarea
                      value={formData.evidence_support}
                      onChange={(e) => setFormData({ ...formData, evidence_support: e.target.value })}
                      placeholder={stepData.subQuestions![0].placeholder}
                      className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none transition-all h-32"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {stepData.subQuestions![1].label}
                    </label>
                    <textarea
                      value={formData.evidence_against}
                      onChange={(e) => setFormData({ ...formData, evidence_against: e.target.value })}
                      placeholder={stepData.subQuestions![1].placeholder}
                      className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none transition-all h-32"
                    />
                  </div>
                </>
              ) : (
                <textarea
                  value={formData[stepData.field!]}
                  onChange={(e) => setFormData({ ...formData, [stepData.field!]: e.target.value })}
                  placeholder={stepData.placeholder}
                  className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none transition-all h-48"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
              ${currentStep === 0 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            <ChevronLeft size={18} />
            上一步
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSave}
              disabled={!formData.newThought.trim()}
              className="flex-1 py-3.5 rounded-xl font-medium bg-purple-600 text-white shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {/* ✅ 已同步修改为：完成按摩 */}
              完成按摩
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl font-medium bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              下一步
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};