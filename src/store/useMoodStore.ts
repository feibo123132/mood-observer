import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MoodRecord } from '../types';
import { db, auth } from '../lib/cloudbase';

interface MoodState {
  currentScore: number;
  setCurrentScore: (score: number) => void;
  
  todayBaseline: number | null;
  lastVisitDate: string | null;
  setTodayBaseline: (score: number) => void;
  
  records: MoodRecord[];
  addRecord: (record: Omit<MoodRecord, 'id' | 'timestamp'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  resetDaily: () => void;
  
  isSyncing: boolean;
  syncFromCloud: () => Promise<void>;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
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
      
      isSyncing: false,

      syncFromCloud: async () => {
        // 使用软身份验证
        const currentEmail = localStorage.getItem('mood_user_email');
        if (!currentEmail) return;

        // 确保连接
        const loginState = await auth.getLoginState();
        if (!loginState) {
          try { await auth.signInAnonymously(); } catch(e) { console.error(e); return; }
        }

        set({ isSyncing: true });
        try {
          // 1. 拉取云端数据 (增加 userId 过滤)
          const res = await db.collection('mood_records')
            .where({ userId: currentEmail })
            .get();
          
          if (res.data) {
            console.log(`云端同步成功，共拉取到 ${res.data.length} 条数据`);
            
            const cloudRecords = res.data.map((item: any) => ({
              id: item.id,
              score: item.score,
              note: item.note,
              timestamp: item.timestamp,
            })) as MoodRecord[];

            // 2. 双向同步：检查本地有哪些数据是云端没有的（补传）
            const cloudIds = new Set(cloudRecords.map(r => r.id));
            const localRecords = get().records;
            const recordsToPush = localRecords.filter(r => !cloudIds.has(r.id));

            if (recordsToPush.length > 0) {
              console.log(`发现 ${recordsToPush.length} 条本地数据待补传...`);
              // 并发上传
              await Promise.all(recordsToPush.map(record => 
                db.collection('mood_records').add({
                  ...record,
                  userId: currentEmail // 关键：补传时加上 userId
                }).catch(e => console.error(`补传失败 ${record.id}:`, e))
              ));
              console.log('补传完成');
              
              recordsToPush.forEach(r => cloudRecords.push(r));
            }

            // 3. 合并数据并更新本地
            set({ records: cloudRecords.sort((a, b) => a.timestamp - b.timestamp) });
          }
        } catch (err) {
          console.error('Sync failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      addRecord: async (record) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        const newRecord = { ...record, id, timestamp };

        // 1. 乐观更新本地
        set((state) => ({
          records: [...state.records, newRecord],
          currentScore: record.score
        }));

        // 2. 异步同步到云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('mood_records').add({
              ...newRecord,
              userId: currentEmail // 关键：写入时加上 userId
            });
          } catch (err) {
            console.error('Upload record failed:', err);
          }
        }
      },

      deleteRecord: async (id) => {
        // 1. 乐观更新本地
        set((state) => ({
          records: state.records.filter((r) => r.id !== id)
        }));

        // 2. 异步同步删除云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            // 增加 userId 校验，防止误删
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .remove();
          } catch (err) {
            console.error('Delete cloud record failed:', err);
          }
        }
      },
      
      resetDaily: () => set({ todayBaseline: null, lastVisitDate: null }),
    }),
    {
      name: 'mood-observer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
