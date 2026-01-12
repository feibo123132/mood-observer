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
  deleteMultipleRecords: (ids: string[]) => Promise<void>;
  restoreRecord: (id: string) => Promise<void>;
  permanentDeleteRecord: (id: string) => Promise<void>;
  cleanupTrash: () => void;
  updateRecord: (id: string, newNote: string) => Promise<void>;
  
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
              deletedAt: item.deletedAt, // Sync deletedAt status
            })) as MoodRecord[];

            // 2. 双向同步：检查本地有哪些数据是云端没有的（补传）
            const cloudIds = new Set(cloudRecords.map(r => r.id));
            const localRecords = get().records;
            const recordsToPush = localRecords.filter(r => !cloudIds.has(r.id));

      // 格式化日期辅助函数
      const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

            if (recordsToPush.length > 0) {
              console.log(`发现 ${recordsToPush.length} 条本地数据待补传...`);
              // 并发上传
              await Promise.all(recordsToPush.map(record => 
                db.collection('mood_records').add({
                  ...record,
                  userId: currentEmail, // 关键：补传时加上 userId
                  createTime: formatDate(record.timestamp) // 增加可读时间字段
                }).catch(e => console.error(`补传失败 ${record.id}:`, e))
              ));
              console.log('补传完成');
              
              // 补传后，将这些数据也加入 cloudRecords
              recordsToPush.forEach(r => cloudRecords.push(r));
            }

            // 3. 合并数据并更新本地 (使用 Map 严格去重)
            const uniqueMap = new Map();
            // 优先保留云端数据（通常更准确）
            cloudRecords.forEach(r => uniqueMap.set(r.id, r));
            
            // 再次确保本地可能存在的最新数据不丢失（理论上 cloudRecords 已经包含了所有，但作为双重保险）
            get().records.forEach(r => {
              if (!uniqueMap.has(r.id)) {
                uniqueMap.set(r.id, r);
              }
            });

            const cleanList = Array.from(uniqueMap.values()) as MoodRecord[];
            
            set({ 
              records: cleanList.sort((a, b) => a.timestamp - b.timestamp) 
            });
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

        // 使用 Map 确保本地更新不重复
        set((state) => {
          const uniqueMap = new Map();
          state.records.forEach(r => uniqueMap.set(r.id, r));
          uniqueMap.set(newRecord.id, newRecord);
          return {
            records: Array.from(uniqueMap.values()) as MoodRecord[],
            currentScore: record.score
          };
        });

        // 格式化日期辅助函数
        const formatDate = (timestamp: number) => {
          const d = new Date(timestamp);
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        // 2. 异步同步到云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('mood_records').add({
              ...newRecord,
              userId: currentEmail, // 关键：写入时加上 userId
              createTime: formatDate(timestamp) // 增加可读时间字段
            });
          } catch (err) {
            console.error('Upload record failed:', err);
          }
        }
      },

      deleteRecord: async (id) => {
        // 软删除：标记 deletedAt
        const now = Date.now();
        set((state) => ({
          records: state.records.map((r) => r.id === id ? { ...r, deletedAt: now } : r)
        }));

        // 异步更新云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: now });
          } catch (err) {
            console.error('Soft delete cloud record failed:', err);
          }
        }
      },

      deleteMultipleRecords: async (ids) => {
        if (!ids || ids.length === 0) return;

        const now = Date.now();
        // 软删除
        set((state) => ({
          records: state.records.map((r) => ids.includes(r.id) ? { ...r, deletedAt: now } : r)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
             // 降级方案：并发更新
             await Promise.all(ids.map(id => 
              db.collection('mood_records')
                .where({ id, userId: currentEmail })
                .update({ deletedAt: now })
                .catch((e: any) => console.error(`Failed to soft delete ${id}`, e))
            ));
          } catch (err) {
            console.error('Delete multiple cloud records failed:', err);
          }
        }
      },

      restoreRecord: async (id) => {
        set((state) => ({
          records: state.records.map((r) => r.id === id ? { ...r, deletedAt: undefined } : r)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            // update field to delete it (or set null)
            // TCB update uses set/remove logic, usually passing null or using specialized delete operator
            // Here we assume updating to null or removing field. For simplicity, we set to null or 0.
            // Let's check TCB update remove field syntax: _.remove()
            const _ = db.command;
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: _.remove() });
          } catch (err) {
            console.error('Restore cloud record failed:', err);
          }
        }
      },

      permanentDeleteRecord: async (id) => {
         set((state) => ({
          records: state.records.filter((r) => r.id !== id)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .remove();
          } catch (err) {
            console.error('Permanent delete cloud record failed:', err);
          }
        }
      },

      cleanupTrash: () => {
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        
        const { records, permanentDeleteRecord } = get();
        records.forEach(r => {
          if (r.deletedAt && (now - r.deletedAt > SEVEN_DAYS)) {
            permanentDeleteRecord(r.id);
          }
        });
      },

      updateRecord: async (id, newNote) => {
        // 1. 乐观更新本地
        set((state) => ({
          records: state.records.map((r) => 
            r.id === id ? { ...r, note: newNote } : r
          )
        }));

        // 2. 异步同步更新云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            // 注意：腾讯云 TCB 的 update 操作通常需要 docId (_id)，但这里我们用 id 字段查询
            // 所以先查询拿到 docId，再更新，或者使用 where().update()
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .update({
                note: newNote
              });
          } catch (err) {
            console.error('Update cloud record failed:', err);
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
