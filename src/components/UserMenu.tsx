import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BarChart2, LogOut, Menu, Volume2, VolumeX, Music, Trash2, Box, MoreHorizontal, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DataMigrationModal } from './DataMigrationModal';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { isAudioEnabled, audioMode, toggleAudio, setAudioMode } = useSettingsStore();
  const [isAudioSettingsExpanded, setIsAudioSettingsExpanded] = useState(false);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 active:scale-95"
        >
          <Menu size={24} />
        </button>
  
        <AnimatePresence>
          {isOpen && (
            <>
              {/* 移动端全屏遮罩，防止误触 */}
              <div 
                className="fixed inset-0 z-40 bg-black/5 md:hidden" 
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleNavigate('/calendar')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Calendar size={18} className="text-slate-400" />
                    日历视图
                  </button>
                  
                  <button
                    onClick={() => handleNavigate('/review')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <BarChart2 size={18} className="text-slate-400" />
                    情绪回顾
                  </button>
  
                  <button
                    onClick={() => handleNavigate('/treasure-box')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Box size={18} className="text-slate-400" />
                    百宝箱
                  </button>
                  
                  <button
                    onClick={() => handleNavigate('/trash')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 size={18} className="text-slate-400" />
                    回收站
                  </button>

                  {/* Others Group */}
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => setIsOthersExpanded(!isOthersExpanded)}
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MoreHorizontal size={18} className="text-slate-400" />
                        其他
                      </div>
                      {isOthersExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {isOthersExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-50 overflow-hidden"
                        >
                          {user && (
                            <button
                              onClick={() => {
                                setIsMigrationOpen(true);
                                setIsOpen(false); // Close menu
                              }}
                              className="w-full px-8 py-2.5 text-left text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-3 transition-colors"
                            >
                              <Settings2 size={14} className="text-indigo-400" />
                              找回旧数据
                            </button>
                          )}
                          {/* Add other items here if needed */}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
  
                  {/* Audio Settings */}
                  <div className="px-4 py-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setIsAudioSettingsExpanded(!isAudioSettingsExpanded)}>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        {isAudioEnabled ? (
                          <Volume2 size={18} className="text-slate-400" />
                        ) : (
                          <VolumeX size={18} className="text-slate-400" />
                        )}
                        语音效果
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAudio();
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                          isAudioEnabled ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div 
                          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${
                            isAudioEnabled ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
  
                    <AnimatePresence>
                      {isAudioSettingsExpanded && isAudioEnabled && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-8 space-y-2 overflow-hidden"
                        >
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center ${audioMode === 'classical' ? 'border-slate-800' : ''}`}>
                              {audioMode === 'classical' && <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />}
                            </div>
                            <input 
                              type="radio" 
                              name="audioMode" 
                              className="hidden" 
                              checked={audioMode === 'classical'}
                              onChange={() => setAudioMode('classical')}
                            />
                            <span className={`text-xs ${audioMode === 'classical' ? 'text-slate-800 font-medium' : 'text-slate-400 group-hover:text-slate-600'}`}>
                              古典模式
                            </span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center ${audioMode === 'modern' ? 'border-slate-800' : ''}`}>
                              {audioMode === 'modern' && <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />}
                            </div>
                            <input 
                              type="radio" 
                              name="audioMode" 
                              className="hidden" 
                              checked={audioMode === 'modern'}
                              onChange={() => setAudioMode('modern')}
                            />
                            <span className={`text-xs ${audioMode === 'modern' ? 'text-slate-800 font-medium' : 'text-slate-400 group-hover:text-slate-600'}`}>
                              近现代模式
                            </span>
                          </label>
  
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center ${audioMode === 'friend' ? 'border-slate-800' : ''}`}>
                              {audioMode === 'friend' && <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />}
                            </div>
                            <input 
                              type="radio" 
                              name="audioMode" 
                              className="hidden" 
                              checked={audioMode === 'friend'}
                              onChange={() => setAudioMode('friend')}
                            />
                            <span className={`text-xs ${audioMode === 'friend' ? 'text-slate-800 font-medium' : 'text-slate-400 group-hover:text-slate-600'}`}>
                              友人模式
                            </span>
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="h-px bg-slate-100 my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={18} />
                    退出登录
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Migration Modal is now managed here */}
      <DataMigrationModal isOpen={isMigrationOpen} onClose={() => setIsMigrationOpen(false)} />
    </>
  );
};
