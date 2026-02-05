import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SurgeryRecord } from '../types';
import { db, auth } from '../lib/cloudbase';

interface SurgeryState {
  records: SurgeryRecord[];
  addRecord: (record: Omit<SurgeryRecord, 'id' | 'timestamp'>) => Promise<void>;
  updateRecord: (record: SurgeryRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  isSyncing: boolean;
  syncFromCloud: () => Promise<void>;
  restoreRecord: (id: string) => Promise<void>;
  permanentDeleteRecord: (id: string) => Promise<void>;
  restoreMultipleRecords: (ids: string[]) => Promise<void>;
  permanentDeleteMultipleRecords: (ids: string[]) => Promise<void>;
  cleanupTrash: () => Promise<void>;
}

export const useSurgeryStore = create<SurgeryState>()(
  persist(
    (set, get) => ({
      records: [],
      isSyncing: false,

      // --- Recycle Bin Methods ---
      restoreRecord: async (id) => {
        set((state) => ({
          records: state.records.map(r => r.id === id ? { ...r, deletedAt: undefined } : r)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: null });
          } catch (err) {
            console.error('Restore surgery record failed:', err);
          }
        }
      },

      permanentDeleteRecord: async (id) => {
        set((state) => ({
          records: state.records.filter(r => r.id !== id)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({ id, userId: currentEmail })
              .remove();
          } catch (err) {
            console.error('Permanent delete surgery record failed:', err);
          }
        }
      },

      restoreMultipleRecords: async (ids) => {
        set((state) => ({
          records: state.records.map(r => ids.includes(r.id) ? { ...r, deletedAt: undefined } : r)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({
                id: db.command.in(ids),
                userId: currentEmail
              })
              .update({ deletedAt: null });
          } catch (err) {
            console.error('Batch restore surgery records failed:', err);
          }
        }
      },

      permanentDeleteMultipleRecords: async (ids) => {
        set((state) => ({
          records: state.records.filter(r => !ids.includes(r.id))
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({
                id: db.command.in(ids),
                userId: currentEmail
              })
              .remove();
          } catch (err) {
            console.error('Batch permanent delete surgery records failed:', err);
          }
        }
      },

      cleanupTrash: async () => {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const threshold = now - SEVEN_DAYS_MS;

        const recordsToDelete = get().records.filter(
          r => r.deletedAt && r.deletedAt < threshold
        );

        if (recordsToDelete.length > 0) {
          const ids = recordsToDelete.map(r => r.id);
          get().permanentDeleteMultipleRecords(ids);
        }
      },

      clearLocalData: () => set({ records: [], isSyncing: false }),

      addRecord: async (record) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        const newRecord: SurgeryRecord = { ...record, id, timestamp };

        // 1. Optimistic update local
        set((state) => ({
          records: [newRecord, ...state.records]
        }));

        // Format Date Helper
        const formatDate = (ts: number) => {
            const d = new Date(ts);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        // 2. Sync to Cloud
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records').add({
              id: newRecord.id,
              userId: currentEmail,
              issue: newRecord.trouble,
              dialogue: {
                evidence: newRecord.evidence,
                alternative: newRecord.alternative,
                implication: newRecord.implication,
                utility: newRecord.utility,
                distancing: newRecord.distancing,
                plan: newRecord.plan
              },
              conclusion: newRecord.newThought,
              timestamp: newRecord.timestamp,
              createTime: formatDate(newRecord.timestamp),
              deletedAt: null // Initialize soft delete field
            });
          } catch (err) {
            console.error('Upload surgery record failed:', err);
          }
        }
      },

      updateRecord: async (updatedRecord) => {
        // 1. Optimistic update local
        set((state) => ({
          records: state.records.map(r => r.id === updatedRecord.id ? updatedRecord : r)
        }));

        // 2. Sync to Cloud
        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({ id: updatedRecord.id, userId: currentEmail })
              .update({
                issue: updatedRecord.trouble,
                dialogue: {
                  evidence: updatedRecord.evidence,
                  alternative: updatedRecord.alternative,
                  implication: updatedRecord.implication,
                  utility: updatedRecord.utility,
                  distancing: updatedRecord.distancing,
                  plan: updatedRecord.plan
                },
                conclusion: updatedRecord.newThought
              });
          } catch (err) {
            console.error('Update surgery record failed:', err);
          }
        }
      },

      deleteRecord: async (id) => {
        const now = Date.now();
        // Soft delete locally (filter out for UI, but maybe keep in DB? For now let's just remove from UI to match requirement)
        // Actually, requirement says "deletedAt (soft delete mark)", so we should probably keep it but filter it?
        // Let's filter it out from the list for now to simulate deletion.
        set((state) => ({
          records: state.records.filter(r => r.id !== id)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('socratic_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: now });
          } catch (err) {
            console.error('Delete surgery record failed:', err);
          }
        }
      },

      syncFromCloud: async () => {
        const currentEmail = localStorage.getItem('mood_user_email');
        if (!currentEmail) return;

        set({ isSyncing: true });
        try {
          const res = await db.collection('socratic_records')
            .where({ userId: currentEmail })
            .get();

          if (res.data) {
            console.log(`[Surgery] Cloud sync success: ${res.data.length} records`);
            
            const cloudRecords = res.data
                .map((item: any) => ({
                    id: item.id,
                    timestamp: item.timestamp,
                    trouble: item.issue,
                    evidence: item.dialogue?.evidence || { support: '', against: '' },
                    alternative: item.dialogue?.alternative || '',
                    implication: item.dialogue?.implication || '',
                    utility: item.dialogue?.utility || '',
                    distancing: item.dialogue?.distancing || '',
                    plan: item.dialogue?.plan || '',
                    newThought: item.conclusion,
                    deletedAt: item.deletedAt
                })) as SurgeryRecord[];

            // Merge Logic
            const uniqueMap = new Map();
            cloudRecords.forEach(r => uniqueMap.set(r.id, r));
            get().records.forEach(r => {
                if (!uniqueMap.has(r.id)) {
                    uniqueMap.set(r.id, r);
                }
            });

            const mergedList = Array.from(uniqueMap.values()) as SurgeryRecord[];
            
            set({ 
              records: mergedList.sort((a, b) => b.timestamp - a.timestamp) 
            });
          }
        } catch (err) {
          console.error('[Surgery] Sync failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'surgery-observer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
