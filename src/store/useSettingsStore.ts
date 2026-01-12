import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AudioMode = 'classical' | 'modern' | 'friend';

interface SettingsState {
  isAudioEnabled: boolean;
  audioMode: AudioMode;
  
  toggleAudio: () => void;
  setAudioMode: (mode: AudioMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isAudioEnabled: true, // 默认开启
      audioMode: 'classical', // 默认古典模式
      
      toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
      setAudioMode: (mode) => set({ audioMode: mode }),
    }),
    {
      name: 'mood-observer-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
