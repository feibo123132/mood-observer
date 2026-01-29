import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MoodRecord, SurgeryRecord } from '../types';
import { db, auth } from '../lib/cloudbase';

interface MoodState {
  currentScore: number;
  setCurrentScore: (score: number) => void;
  
  todayBaseline: number | null;
  lastVisitDate: string | null;
  setTodayBaseline: (score: number) => void;
  
  records: MoodRecord[];
  surgeryRecords: SurgeryRecord[];
  addRecord: (record: Omit<MoodRecord, 'id' | 'timestamp'>) => Promise<void>;
  addSurgeryRecord: (record: Omit<SurgeryRecord, 'id' | 'timestamp'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteMultipleRecords: (ids: string[]) => Promise<void>;
  restoreRecord: (id: string) => Promise<void>;
  restoreMultipleRecords: (ids: string[]) => Promise<void>;
  permanentDeleteRecord: (id: string) => Promise<void>;
  permanentDeleteMultipleRecords: (ids: string[]) => Promise<void>;
  cleanupTrash: () => void;
  updateRecord: (id: string, updates: { note?: string; score?: number }) => Promise<void>;
  
  resetDaily: () => void;
  
  isSyncing: boolean;
  syncFromCloud: () => Promise<void>;
  
  // Weekly Reports
  reports: Record<string, string>; // Key: "year-week", Value: report content
  saveReport: (year: number, week: number, content: string) => void;
  deleteReport: (year: number, week: number) => void;

  clearLocalData: () => void;
  fixLegacyData: () => Promise<void>;
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
      surgeryRecords: [],
      
      isSyncing: false,

      // Report Logic
      reports: {},
      saveReport: (year, week, content) => set((state) => ({
        reports: { ...state.reports, [`${year}-${week}`]: content }
      })),
      deleteReport: (year, week) => set((state) => {
        const newReports = { ...state.reports };
        delete newReports[`${year}-${week}`];
        return { reports: newReports };
      }),

      clearLocalData: () => set({
        currentScore: 50,
        todayBaseline: null,
        lastVisitDate: null,
        records: [],
        surgeryRecords: [],
        isSyncing: false,
        reports: {}
      }),

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
              type: item.type,
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
        // FIXED: 强制使用当前时间，不依赖外部输入
        const timestamp = Date.now();
        const date = new Date().toISOString();

        // 注意：这里显式覆盖了 record 中的 date 和 timestamp
        const newRecord = { ...record, id, timestamp, date };

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

      addSurgeryRecord: async (record) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        const newRecord: SurgeryRecord = { ...record, id, timestamp };

        set((state) => ({
          surgeryRecords: [newRecord, ...state.surgeryRecords]
        }));
        
        // 格式化日期辅助函数
        const formatDate = (timestamp: number) => {
          const d = new Date(timestamp);
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        // Sync to cloud (Optional: create a new collection 'surgery_records')
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
             // Check if collection exists or just use a new one. 
             // For now, let's assume 'surgery_records' collection exists or is auto-created.
             await db.collection('surgery_records').add({
               ...newRecord,
               userId: currentEmail,
               createTime: formatDate(timestamp)
             });
          } catch (err) {
            console.error('Upload surgery record failed:', err);
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
            const _ = db.command;
            await db.collection('mood_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: _.remove() });
          } catch (err) {
            console.error('Restore cloud record failed:', err);
          }
        }
      },

      restoreMultipleRecords: async (ids) => {
        if (!ids || ids.length === 0) return;
        
        set((state) => ({
          records: state.records.map((r) => ids.includes(r.id) ? { ...r, deletedAt: undefined } : r)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            const _ = db.command;
            // 并发更新云端
            await Promise.all(ids.map(id => 
              db.collection('mood_records')
                .where({ id, userId: currentEmail })
                .update({ deletedAt: _.remove() })
                .catch((e: any) => console.error(`Failed to restore ${id}`, e))
            ));
          } catch (err) {
            console.error('Restore multiple cloud records failed:', err);
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

      permanentDeleteMultipleRecords: async (ids) => {
        if (!ids || ids.length === 0) return;

        set((state) => ({
          records: state.records.filter((r) => !ids.includes(r.id))
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            // 并发删除云端数据
            await Promise.all(ids.map(id => 
              db.collection('mood_records')
                .where({ id, userId: currentEmail })
                .remove()
                .catch((e: any) => console.error(`Failed to permanently delete ${id}`, e))
            ));
          } catch (err) {
            console.error('Permanent delete multiple cloud records failed:', err);
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

      updateRecord: async (id, updates) => {
        // 1. 乐观更新本地
        set((state) => ({
          records: state.records.map((r) => 
            r.id === id ? { ...r, ...updates } : r
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
              .update(updates);
          } catch (err) {
            console.error('Update cloud record failed:', err);
          }
        }
      },

      fixLegacyData: async () => {
        const { records } = get();
        const now = Date.now();
        // 注意：这里不能用同一个 date 字符串覆盖所有，否则所有修复后的记录时间都一样了。
        // 应该针对每条记录，用它自己的 timestamp 生成 date。
        
        // 找出需要修复的记录 ID:
        // 1. timestamp 小于 2026 年
        // 2. OR date 字段缺失
        const recordsToFix = records.filter(r => 
          !r.date || new Date(r.timestamp).getFullYear() < 2026
        );
        
        const idsToFix = recordsToFix.map(r => r.id);

        if (idsToFix.length === 0) {
          console.log('🎉 没有发现脏数据 (缺失 date 或年份错误)。');
          return;
        }

        console.log(`🧹 发现 ${idsToFix.length} 条脏数据，开始修复...`);

        // 批量更新本地
        set(state => ({
          records: state.records.map(r => {
            if (idsToFix.includes(r.id)) {
              // 如果年份错误，强制更新到当前时间
              const isYearWrong = new Date(r.timestamp).getFullYear() < 2026;
              const newTimestamp = isYearWrong ? now : r.timestamp;
              const newDate = new Date(newTimestamp).toISOString();
              
              return { ...r, timestamp: newTimestamp, date: newDate };
            }
            return r;
          })
        }));

        // 批量更新云端
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          console.log('☁️ 正在同步修复到云端...');
          try {
            // 注意：这里需要对每条记录单独计算 timestamp 和 date，所以不能简单地批量 update 相同的值
            // 但为了简化，如果主要是修复旧年份数据，我们可以统一更新。
            // 如果是修复 date 缺失但 timestamp 正确的数据，我们应该用它原本的 timestamp。
            
            // 策略：遍历所有待修复记录，逐条（或分组）更新
            const updates = recordsToFix.map(r => {
              const isYearWrong = new Date(r.timestamp).getFullYear() < 2026;
              const newTimestamp = isYearWrong ? now : r.timestamp;
              const newDate = new Date(newTimestamp).toISOString();
              
              return db.collection('mood_records')
                .where({ id: r.id, userId: currentEmail })
                .update({ timestamp: newTimestamp, date: newDate });
            });

            const results = await Promise.allSettled(updates);
            
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`✅ 修复完成！本地更新 ${idsToFix.length} 条，云端同步成功 ${successCount} 条。`);
          } catch (err) {
            console.error('云端批量修复失败:', err);
          }
        } else {
          console.log(`✅ 本地修复完成！(未登录，跳过云端同步)`);
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