import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MoodRecord } from '../types';

interface MoodState {
  currentScore: number;
  setCurrentScore: (score: number) => void;
  
  todayBaseline: number | null;
  lastVisitDate: string | null;
  setTodayBaseline: (score: number) => void;
  
  records: MoodRecord[];
  addRecord: (record: Omit<MoodRecord, 'id' | 'timestamp'>) => void;
  deleteRecord: (id: string) => void;
  
  resetDaily: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      currentScore: 50,
      setCurrentScore: (score) => set({ currentScore: score }),
      
      todayBaseline: null,
      lastVisitDate: null,
      
      setTodayBaseline: (score) => set({ 
        todayBaseline: score, 
        lastVisitDate: new Date().toISOString().split('T')[0],
        currentScore: score
      }),
      
      records: [],
      addRecord: (record) => set((state) => ({
        records: [
          ...state.records,
          {
            ...record,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          },
        ],
        currentScore: record.score
      })),

      deleteRecord: (id) => set((state) => ({
        records: state.records.filter((r) => r.id !== id)
      })),
      
      resetDaily: () => set({ todayBaseline: null, lastVisitDate: null }),
    }),
    {
      name: 'mood-observer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
