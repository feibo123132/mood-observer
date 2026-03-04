import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PenLine, X, Check, User, RefreshCw, Trees, Map, HeartPulse } from 'lucide-react';
import { MoodSphere } from '../components/MoodSphere';
import { MoodSlider } from '../components/MoodSlider';
import { UserMenu } from '../components/UserMenu';
import { DietRecordModal, ExerciseRecordModal, SleepRecordModal } from '../components/HealthQuickRecordModals';
import { useMoodStore } from '../store/useMoodStore';
import { useAuthStore } from '../store/useAuthStore';
import { RecordType } from '../types';
import { audioPlayer } from '../services/AudioPlayer';
import { getHarvestLevel } from '../utils/harvestUtils';
import { getHealthStateByScore, getHealthStates, HealthStatus } from '../utils/healthUtils';

export const HomePage = () => {
  const {
    currentScore,
    setCurrentScore,
    lastVisitDate,
    setTodayBaseline,
    addRecord,
    records
  } = useMoodStore();

  const { user, initAuth, logout } = useAuthStore();

  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [moodNote, setMoodNote] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [healthNote, setHealthNote] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('comfortable');
  const [recordScore, setRecordScore] = useState(currentScore);
  const [recordType, setRecordType] = useState<RecordType>('mood');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const [isWakeUp, setIsWakeUp] = useState(false);
  const [wakeUpScore, setWakeUpScore] = useState(50);

  const displayScore = useMemo(() => {
    const now = new Date();
    const todayRecords = records.filter((r) => {
      const rDate = new Date(r.timestamp);
      return (
        rDate.getDate() === now.getDate() &&
        rDate.getMonth() === now.getMonth() &&
        rDate.getFullYear() === now.getFullYear()
      );
    });

    if (todayRecords.length === 0) {
      return currentScore;
    }

    return Math.max(...todayRecords.map((r) => r.score));
  }, [records, currentScore]);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      useMoodStore.getState().syncFromCloud();
    }
  }, [user]);

  useEffect(() => {
    if (isRecording) {
      audioPlayer.preload(recordScore);
    }
  }, [isRecording, recordScore]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isNewDay = lastVisitDate !== todayStr;

  const hasTodayRecords = useMemo(() => {
    const now = new Date();
    return records.some((r) => {
      const rDate = new Date(r.timestamp);
      return (
        rDate.getDate() === now.getDate() &&
        rDate.getMonth() === now.getMonth() &&
        rDate.getFullYear() === now.getFullYear()
      );
    });
  }, [records]);

  useEffect(() => {
    if (isNewDay) {
      setIsWakeUp(!hasTodayRecords);
    } else {
      setIsWakeUp(false);
    }
  }, [isNewDay, hasTodayRecords]);

  useEffect(() => {
    if (isWakeUp) {
      audioPlayer.preload(wakeUpScore);
    }
  }, [wakeUpScore, isWakeUp]);

  const handleSetBaseline = () => {
    setTodayBaseline(wakeUpScore);
    setCurrentScore(wakeUpScore);

    addRecord({
      score: wakeUpScore,
      note: '晨间打卡',
      type: 'mood'
    });

    audioPlayer.play(wakeUpScore);
    setIsWakeUp(false);
  };

  const handleSelectRecordType = (newType: RecordType) => {
    setRecordType(newType);
    setIsModeMenuOpen(false);
    setIsSleepModalOpen(false);
    setIsDietModalOpen(false);
    setIsExerciseModalOpen(false);

    if (newType === 'harvest') {
      setRecordScore(60);
      return;
    }

    if (newType === 'health') {
      const health = getHealthStateByScore(85);
      setHealthStatus(health.value);
      setRecordScore(health.score);
      return;
    }

    setRecordScore(currentScore);
  };

  const handleSaveRecord = () => {
    const note =
      recordType === 'mood'
        ? moodNote
        : recordType === 'harvest'
          ? harvestNote
          : healthNote;

    const fallbackNote =
      recordType === 'harvest'
        ? '收获记录'
        : recordType === 'health'
          ? '健康记录'
          : '记录当下';

    addRecord({
      score: recordScore,
      note: note || fallbackNote,
      type: recordType
    });

    if (recordType === 'mood') {
      setCurrentScore(recordScore);
    }

    audioPlayer.play(recordScore);

    setIsRecording(false);
    setMoodNote('');
    setHarvestNote('');
    setHealthNote('');
    setHealthStatus('comfortable');
    setIsModeMenuOpen(false);
    setIsSleepModalOpen(false);
    setIsDietModalOpen(false);
    setIsExerciseModalOpen(false);
    setRecordType('mood');
  };

  const upsertHealthAutoLine = (prefix: string, summary: string) => {
    setHealthNote((prev) => {
      const lines = prev
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const nextLines = lines.filter((line) => !line.startsWith(prefix));
      nextLines.push(summary);
      return nextLines.join('\n').slice(0, 300);
    });
  };

  const getModeTitle = () => {
    if (recordType === 'mood') {
      return (
        <>
          <Trees size={18} className="text-green-600" />
          情绪之森
        </>
      );
    }

    if (recordType === 'harvest') {
      return (
        <>
          <Map size={18} className="text-amber-500" />
          宝藏之旅
        </>
      );
    }

    return (
      <>
        <HeartPulse size={18} className="text-rose-500" />
        健康记录
      </>
    );
  };

  if (isWakeUp) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-md flex flex-col items-center gap-12"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light text-slate-800">你好呀，情绪观察员</h1>
            <p className="text-slate-500">请设定今天的情绪基调</p>
          </div>

          <MoodSphere score={wakeUpScore} size={200} />

          <MoodSlider value={wakeUpScore} onChange={setWakeUpScore} className="mt-8" />

          <button
            onClick={handleSetBaseline}
            className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-4"
          >
            开启今日
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden transition-colors duration-700">
      <div className="w-full max-w-md p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (user) {
                if (window.confirm('确定要退出登录吗？')) {
                  logout();
                }
              } else {
                navigate('/login');
              }
            }}
            className={`p-2 rounded-full transition-colors ${user ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'} relative`}
          >
            <User size={20} />
            {!user && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white transform translate-x-1/3 -translate-y-1/3" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">JIEYOU不解忧</span>
          {!user && (
            <span className="text-[10px] text-red-400 font-light mt-0.5 animate-pulse">未登录（数据仅本地保存）</span>
          )}
        </div>

        <UserMenu />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 min-h-[60vh]">
        <MoodSphere score={displayScore} size={320} />

        <div className="flex flex-col items-center gap-12 mt-24">
          <button
            onClick={() => {
              setRecordScore(currentScore);
              setRecordType('mood');
              setIsModeMenuOpen(false);
              setIsRecording(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md shadow-lg rounded-full text-slate-700 font-medium hover:bg-white transition-all transform hover:scale-105"
          >
            <PenLine size={18} />
            <span>记录当下</span>
          </button>

          <div className="text-center px-6 space-y-4">
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              "无关好坏，每种情绪都是心灵的一部分，
              <br />
              我们要做的，只是静静地感受、记录并默默地陪伴着它们便好。"
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="p-6 flex justify-between items-center">
                <button
                  onClick={() => {
                    setIsModeMenuOpen(false);
                    setIsSleepModalOpen(false);
                    setIsDietModalOpen(false);
                    setIsExerciseModalOpen(false);
                    setIsRecording(false);
                  }}
                  className="p-2 rounded-full hover:bg-slate-100"
                >
                <X size={24} className="text-slate-500" />
              </button>

              <div className="relative flex items-center gap-2">
                <span className="font-medium text-slate-800 flex items-center gap-2">{getModeTitle()}</span>
                <button
                  onClick={() => setIsModeMenuOpen((v) => !v)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
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
                      className="absolute top-10 right-0 w-44 rounded-xl border border-slate-100 bg-white p-2 shadow-xl z-20"
                    >
                      {[
                        { type: 'mood' as RecordType, label: '情绪之森', icon: Trees, color: 'text-green-600' },
                        { type: 'harvest' as RecordType, label: '宝藏之旅', icon: Map, color: 'text-amber-500' },
                        { type: 'health' as RecordType, label: '健康记录', icon: HeartPulse, color: 'text-rose-500' }
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleSelectRecordType(item.type)}
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

              <button onClick={handleSaveRecord} className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                <Check size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
              {recordType === 'mood' ? (
                <>
                  <MoodSphere score={recordScore} size={180} />
                  <MoodSlider value={recordScore} onChange={setRecordScore} />
                </>
              ) : recordType === 'harvest' ? (
                (() => {
                  const level = getHarvestLevel(recordScore);
                  return (
                    <>
                      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                        <motion.div
                          className="absolute inset-0 rounded-full blur-3xl opacity-40"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                          style={{ background: level.color }}
                        />

                        <motion.div
                          className="w-full h-full rounded-full relative z-10"
                          animate={{
                            scale: [0.95, 1.05, 0.95]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                          style={{
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${level.color})`,
                            boxShadow: `0 0 60px ${level.color}`
                          }}
                        />
                      </div>

                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold" style={{ color: level.color }}>
                          {level.label}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-mono tracking-wider">
                          SCORE:
                          <input
                            type="number"
                            min="60"
                            max="100"
                            value={recordScore}
                            onChange={(e) => {
                              let val = Number(e.target.value);
                              if (val < 60) val = 60;
                              if (val > 100) val = 100;
                              setRecordScore(val);
                            }}
                            className="w-12 bg-transparent border-b border-gray-300 focus:border-slate-500 focus:outline-none text-center font-mono"
                          />
                        </div>
                        <p className="text-sm text-slate-500">{level.description}</p>
                      </div>

                      <div className="w-full max-w-md h-2 bg-slate-100 rounded-full relative">
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
                            left: `${((recordScore - 60) / 40) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            borderColor: level.color
                          }}
                        />

                        <input
                          type="range"
                          min="60"
                          max="100"
                          step="1"
                          value={recordScore}
                          onChange={(e) => setRecordScore(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                        />
                      </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  const healthState = getHealthStateByScore(recordScore);
                  const healthOptions = getHealthStates();

                  return (
                    <div className="w-full max-w-md flex flex-col items-center gap-6">
                      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                        <motion.div
                          className="absolute inset-0 rounded-full blur-3xl opacity-35"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ background: healthState.color }}
                        />
                        <motion.div
                          className="w-full h-full rounded-full relative z-10"
                          animate={{ scale: [0.96, 1.04, 0.96] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), ${healthState.color})`,
                            boxShadow: `0 0 60px ${healthState.color}`
                          }}
                        />
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="text-2xl font-bold" style={{ color: healthState.color }}>
                          {healthState.label}
                        </h3>
                        <p className="text-sm text-slate-500">{healthState.description}</p>
                      </div>

                      <div className="w-full grid grid-cols-3 gap-2">
                        {healthOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setHealthStatus(option.value);
                              setRecordScore(option.score);
                            }}
                            className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                              healthStatus === option.value
                                ? 'border-slate-700 bg-slate-50 text-slate-800'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {recordType === 'health' && (
                <div className="w-full max-w-md">
                  <div className="grid grid-cols-3 gap-2">
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

              <div className="w-full max-w-md mt-4">
                <textarea
                  value={recordType === 'mood' ? moodNote : recordType === 'harvest' ? harvestNote : healthNote}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (recordType === 'mood') setMoodNote(val);
                    if (recordType === 'harvest') setHarvestNote(val);
                    if (recordType === 'health') setHealthNote(val);
                  }}
                  placeholder={
                    recordType === 'mood'
                      ? '今天的旅途，你又遇到了哪些想要记录的事或情绪？(可选)'
                      : recordType === 'harvest'
                        ? '今天的旅途，你又收获了哪些值得记录的宝箱？（可选）'
                        : '记录今天的身体状态、症状或恢复情况（可选）'
                  }
                  maxLength={300}
                  className="w-full p-4 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700 placeholder:text-slate-400 text-center"
                  rows={3}
                />
                <div className="text-right text-xs text-slate-400 mt-2">
                  {(recordType === 'mood' ? moodNote : recordType === 'harvest' ? harvestNote : healthNote).length}/300
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SleepRecordModal
        isOpen={isRecording && recordType === 'health' && isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine('睡眠记录：', summary)}
      />

      <DietRecordModal
        isOpen={isRecording && recordType === 'health' && isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine('饮食记录：', summary)}
      />

      <ExerciseRecordModal
        isOpen={isRecording && recordType === 'health' && isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onConfirm={(summary) => upsertHealthAutoLine('运动记录：', summary)}
      />
    </div>
  );
};
