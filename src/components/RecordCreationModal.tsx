import { X, Save, Calendar, Clock, Trees, Map, RefreshCw, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { MoodSlider } from './MoodSlider';
import { DietRecordModal, ExerciseRecordModal, SleepRecordModal } from './HealthQuickRecordModals';
import { useMoodStore } from '../store/useMoodStore';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import { getHealthStateByScore, getHealthStates } from '../utils/healthUtils';
import { RecordType } from '../types';

interface RecordCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
}

export const RecordCreationModal = ({ isOpen, onClose, initialDate }: RecordCreationModalProps) => {
  const [note, setNote] = useState('');
  const [score, setScore] = useState(50);
  const [recordType, setRecordType] = useState<RecordType>('mood');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const { addRecord } = useMoodStore();

  const SLEEP_PREFIX = '睡眠记录：';
  const DIET_PREFIX = '饮食记录：';
  const EXERCISE_PREFIX = '运动记录：';

  useEffect(() => {
    if (isOpen) return;
    setIsModeMenuOpen(false);
    setIsSleepModalOpen(false);
    setIsDietModalOpen(false);
    setIsExerciseModalOpen(false);
  }, [isOpen]);

  const handleChangeType = (type: RecordType) => {
    setRecordType(type);
    setIsModeMenuOpen(false);
    setIsSleepModalOpen(false);
    setIsDietModalOpen(false);
    setIsExerciseModalOpen(false);

    if (type === 'harvest') {
      setScore(60);
      return;
    }

    if (type === 'health') {
      setScore(getHealthStateByScore(85).score);
      return;
    }

    setScore(50);
  };

  const upsertHealthAutoLine = (prefix: string, summary: string) => {
    setNote((prev) => {
      const recordMeta = [
        { prefix: SLEEP_PREFIX, emoji: '😴' },
        { prefix: DIET_PREFIX, emoji: '🍽️' },
        { prefix: EXERCISE_PREFIX, emoji: '🏃' }
      ];
      const stripOrderPrefix = (line: string) => line.replace(/^\d+[\.\u3001]\s*/, '');
      const stripEmojiPrefix = (line: string) => line.replace(/^(😴|🍽️|🏃)\s*/, '');
      const normalizeRecordLine = (line: string) => stripEmojiPrefix(stripOrderPrefix(line));
      const getRecordMeta = (line: string) => recordMeta.find((item) => line.startsWith(item.prefix));

      const lines = prev
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const entries = lines.map((line) => normalizeRecordLine(line));
      const existingIndex = entries.findIndex((line) => line.startsWith(prefix));

      if (existingIndex >= 0) {
        entries[existingIndex] = summary;
      } else {
        entries.push(summary);
      }

      let recordIndex = 0;
      const nextLines = entries.map((line) => {
        const meta = getRecordMeta(line);
        if (!meta) return line;
        recordIndex += 1;
        return `${recordIndex}. ${meta.emoji} ${line}`;
      });

      return nextLines.join('\n').slice(0, 300);
    });
  };

  const handleSave = async () => {
    const now = new Date();
    const targetTimestamp = new Date(initialDate);
    targetTimestamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const fallbackNote =
      recordType === 'harvest'
        ? '收获记录'
        : recordType === 'health'
          ? '健康记录'
          : '补记心情';

    await addRecord({
      score,
      note: note || fallbackNote,
      type: recordType,
      timestamp: targetTimestamp.getTime()
    });

    setNote('');
    setScore(50);
    setRecordType('mood');
    setIsModeMenuOpen(false);
    setIsSleepModalOpen(false);
    setIsDietModalOpen(false);
    setIsExerciseModalOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  const state =
    recordType === 'harvest'
      ? { label: getHarvestLevel(score).label, color: getHarvestLevel(score).color }
      : recordType === 'health'
        ? { label: getHealthStateByScore(score).label, color: getHealthStateByScore(score).color }
        : getMoodState(score);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div
              className="p-6 text-center text-white transition-colors duration-500 relative overflow-visible"
              style={{ backgroundColor: state.color }}
            >
              <div className="relative z-10">
                <div className="text-5xl font-bold mb-2">{score}</div>
                <div className="text-lg font-medium opacity-90 flex items-center justify-center gap-2">
                  <span>{state.label}</span>

                  <div className="relative ml-1">
                    <button
                      onClick={() => setIsModeMenuOpen((v) => !v)}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                      title="切换模式"
                    >
                      <RefreshCw size={14} />
                    </button>

                    <AnimatePresence>
                      {isModeMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="absolute top-9 right-0 w-44 rounded-xl border border-slate-100 bg-white p-2 shadow-xl z-30"
                        >
                          {[
                            { type: 'mood' as RecordType, label: '情绪之森', icon: Trees, color: 'text-green-600' },
                            { type: 'harvest' as RecordType, label: '宝藏之旅', icon: Map, color: 'text-amber-500' },
                            { type: 'health' as RecordType, label: '健康记录', icon: HeartPulse, color: 'text-rose-500' }
                          ].map((item) => (
                            <button
                              key={item.type}
                              onClick={() => handleChangeType(item.type)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                recordType === item.type ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <item.icon size={15} className={item.color} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-50"
              >
                <X size={20} />
              </button>

              <div className="absolute top-4 left-4 p-2 bg-white/20 rounded-full">
                {recordType === 'mood' ? (
                  <Trees size={20} />
                ) : recordType === 'harvest' ? (
                  <Map size={20} />
                ) : (
                  <HeartPulse size={20} />
                )}
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between text-sm text-slate-400 px-2">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{format(initialDate, 'yyyy-MM-dd')} (补记)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{format(new Date(), 'HH:mm')}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4">
                  {recordType === 'mood' ? '情绪强度' : recordType === 'harvest' ? '宝藏稀有度' : '身体情况'}
                </h3>

                {recordType === 'harvest' ? (
                  <div className="w-full max-w-md flex flex-col items-center gap-6">
                    <div className="w-full h-2 bg-slate-100 rounded-full relative">
                      <div className="absolute inset-0 rounded-full overflow-hidden flex">
                        <div className="h-full bg-gray-400" style={{ width: '25%' }} />
                        <div className="h-full bg-green-500" style={{ width: '25%' }} />
                        <div className="h-full bg-blue-500" style={{ width: '25%' }} />
                        <div className="h-full bg-purple-500" style={{ width: '15%' }} />
                        <div className="h-full bg-yellow-500" style={{ width: '10%' }} />
                      </div>

                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md border-4 transition-all duration-75 pointer-events-none z-20"
                        style={{
                          left: `${((score - 60) / 40) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          borderColor: state.color
                        }}
                      />

                      <input
                        type="range"
                        min="60"
                        max="100"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                      />
                    </div>
                  </div>
                ) : recordType === 'health' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {getHealthStates().map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setScore(option.score)}
                        className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                          getHealthStateByScore(score).value === option.value
                            ? 'border-slate-700 bg-slate-50 text-slate-800'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <MoodSlider value={score} onChange={setScore} />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {recordType === 'mood' ? '心情笔记' : recordType === 'harvest' ? '宝藏线索' : '日常记录'}
                </label>

                {recordType === 'health' && (
                  <div className="w-full">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setIsSleepModalOpen(true)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        睡眠记录
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDietModalOpen(true)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        饮食记录
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExerciseModalOpen(true)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        运动记录
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-sm leading-relaxed"
                  rows={4}
                  placeholder={
                    recordType === 'mood'
                      ? '当时发生了什么？...'
                      : recordType === 'harvest'
                        ? '发现了什么宝藏？...'
                        : '记录身体状态、症状与恢复情况...'
                  }
                  maxLength={300}
                />
                <div className="text-right text-xs text-slate-400">{note.length}/300</div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Save size={18} />
                  确认补记
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <SleepRecordModal
        isOpen={isOpen && recordType === 'health' && isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine(SLEEP_PREFIX, summary)}
      />

      <DietRecordModal
        isOpen={isOpen && recordType === 'health' && isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine(DIET_PREFIX, summary)}
      />

      <ExerciseRecordModal
        isOpen={isOpen && recordType === 'health' && isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine(EXERCISE_PREFIX, summary)}
      />
    </>
  );
};
