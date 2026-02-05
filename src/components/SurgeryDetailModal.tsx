import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit3, Save, CheckCircle, Scale, BrainCircuit, AlertTriangle, Target, Lightbulb, Footprints } from 'lucide-react';
import { SurgeryRecord } from '../types';

interface SurgeryDetailModalProps {
  record: SurgeryRecord;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (record: SurgeryRecord) => void;
}

export const SurgeryDetailModal = ({ record, onClose, onDelete, onUpdate }: SurgeryDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SurgeryRecord>({ ...record });

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条手术记录吗？此操作无法撤销。')) {
      onDelete(record.id);
      onClose();
    }
  };

  const steps = [
    {
      id: 'trouble',
      icon: <AlertTriangle size={18} className="text-red-500" />,
      title: '原始烦恼',
      content: editForm.trouble,
      color: 'bg-red-50 border-red-100',
      field: 'trouble'
    },
    {
      id: 'evidence',
      icon: <Scale size={18} className="text-blue-500" />,
      title: '证据天平',
      type: 'split',
      content: {
        left: { title: '支持证据', text: editForm.evidence.support, field: 'evidence.support' },
        right: { title: '反对证据', text: editForm.evidence.against, field: 'evidence.against' }
      },
      color: 'bg-blue-50 border-blue-100'
    },
    {
      id: 'alternative',
      icon: <BrainCircuit size={18} className="text-orange-500" />,
      title: '替代思维',
      content: editForm.alternative,
      color: 'bg-orange-50 border-orange-100',
      field: 'alternative'
    },
    {
      id: 'implication',
      icon: <Target size={18} className="text-yellow-500" />,
      title: '最坏结果',
      content: editForm.implication,
      color: 'bg-yellow-50 border-yellow-100',
      field: 'implication'
    },
    {
      id: 'utility',
      icon: <CheckCircle size={18} className="text-green-500" />,
      title: '实用性评估',
      content: editForm.utility,
      color: 'bg-green-50 border-green-100',
      field: 'utility'
    },
    {
      id: 'distancing',
      icon: <Footprints size={18} className="text-indigo-500" />,
      title: '旁观者视角',
      content: editForm.distancing,
      color: 'bg-indigo-50 border-indigo-100',
      field: 'distancing'
    },
    {
      id: 'plan',
      icon: <Target size={18} className="text-teal-500" />,
      title: '行动计划',
      content: editForm.plan,
      color: 'bg-teal-50 border-teal-100',
      field: 'plan'
    },
    {
      id: 'newThought',
      icon: <Lightbulb size={18} className="text-purple-600" />,
      title: '新的认知',
      content: editForm.newThought,
      color: 'bg-purple-50 border-purple-200 shadow-sm',
      field: 'newThought',
      highlight: true
    }
  ];

  const updateField = (fieldPath: string, value: string) => {
    if (fieldPath.includes('.')) {
      const [parent, child] = fieldPath.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof SurgeryRecord] as any,
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [fieldPath]: value
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b border-slate-100 z-10">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500">
          <X size={24} />
        </button>
        <span className="font-medium text-slate-800">
          {new Date(record.timestamp).toLocaleDateString()} 手术记录
        </span>
        <div className="flex gap-2">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
            >
              <Save size={20} />
            </button>
          ) : (
            <>
              <button 
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Edit3 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`rounded-2xl p-5 border ${step.color} ${step.highlight ? 'ring-2 ring-purple-100' : ''}`}
          >
            <div className="flex items-center gap-2 mb-3">
              {step.icon}
              <h3 className="text-sm font-bold text-slate-700">{step.title}</h3>
            </div>

            {step.type === 'split' ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Support */}
                <div className="bg-white/50 rounded-xl p-3">
                  <div className="text-xs font-bold text-slate-400 mb-2">{(step.content as any).left.title}</div>
                  {isEditing ? (
                    <textarea
                      value={(step.content as any).left.text}
                      onChange={(e) => updateField((step.content as any).left.field, e.target.value)}
                      className="w-full bg-white rounded-lg p-2 text-sm border border-slate-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{(step.content as any).left.text || '无'}</p>
                  )}
                </div>
                {/* Right: Against */}
                <div className="bg-white/50 rounded-xl p-3">
                  <div className="text-xs font-bold text-slate-400 mb-2">{(step.content as any).right.title}</div>
                  {isEditing ? (
                    <textarea
                      value={(step.content as any).right.text}
                      onChange={(e) => updateField((step.content as any).right.field, e.target.value)}
                      className="w-full bg-white rounded-lg p-2 text-sm border border-slate-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{(step.content as any).right.text || '无'}</p>
                  )}
                </div>
              </div>
            ) : (
              // Standard Field
              isEditing ? (
                <textarea
                  value={step.content as string}
                  onChange={(e) => updateField(step.field!, e.target.value)}
                  className="w-full bg-white/80 rounded-xl p-3 text-sm text-slate-700 border border-slate-200 focus:ring-2 focus:ring-purple-200 outline-none resize-none leading-relaxed"
                  rows={4}
                />
              ) : (
                <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${step.highlight ? 'font-medium' : ''}`}>
                  {step.content as string || '未记录'}
                </p>
              )
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
