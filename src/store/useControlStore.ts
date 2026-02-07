import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ControlRecord } from '../types';
import { db } from '../lib/cloudbase';

interface ControlState {
  records: ControlRecord[];
  addRecord: (record: Omit<ControlRecord, 'id' | 'timestamp'>) => Promise<void>;
  updateRecord: (record: ControlRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  isSyncing: boolean;
  syncFromCloud: () => Promise<void>;
  restoreRecord: (id: string) => Promise<void>;
  permanentDeleteRecord: (id: string) => Promise<void>;
  restoreMultipleRecords: (ids: string[]) => Promise<void>;
  permanentDeleteMultipleRecords: (ids: string[]) => Promise<void>;
  cleanupTrash: () => Promise<void>;
}

export const useControlStore = create<ControlState>()(
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
            await db.collection('control_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: null });
          } catch (err) {
            console.error('Restore control record failed:', err);
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
            await db.collection('control_records')
              .where({ id, userId: currentEmail })
              .remove();
          } catch (err) {
            console.error('Permanent delete control record failed:', err);
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
            await db.collection('control_records')
              .where({
                id: db.command.in(ids),
                userId: currentEmail
              })
              .update({ deletedAt: null });
          } catch (err) {
            console.error('Batch restore control records failed:', err);
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
            await db.collection('control_records')
              .where({
                id: db.command.in(ids),
                userId: currentEmail
              })
              .remove();
          } catch (err) {
            console.error('Batch permanent delete control records failed:', err);
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

      addRecord: async (record) => {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        const newRecord: ControlRecord = { ...record, id, timestamp };

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
            await db.collection('control_records').add({
              id: newRecord.id,
              userId: currentEmail,
              challenge: newRecord.challenge,
              items: newRecord.items,
              summary: newRecord.summary,
              timestamp: newRecord.timestamp,
              createTime: formatDate(newRecord.timestamp),
              deletedAt: null
            });
          } catch (err) {
            console.error('Upload control record failed:', err);
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
            await db.collection('control_records')
              .where({ id: updatedRecord.id, userId: currentEmail })
              .update({
                challenge: updatedRecord.challenge,
                items: updatedRecord.items,
                summary: updatedRecord.summary,
              });
          } catch (err) {
            console.error('Update control record failed:', err);
          }
        }
      },

      deleteRecord: async (id) => {
        const now = Date.now();
        set((state) => ({
          records: state.records.filter(r => r.id !== id)
        }));

        const currentEmail = localStorage.getItem('mood_user_email');
        if (currentEmail) {
          try {
            await db.collection('control_records')
              .where({ id, userId: currentEmail })
              .update({ deletedAt: now });
          } catch (err) {
            console.error('Delete control record failed:', err);
          }
        }
      },

      syncFromCloud: async () => {
        const currentEmail = localStorage.getItem('mood_user_email');
        if (!currentEmail) return;

        set({ isSyncing: true });
        try {
          const res = await db.collection('control_records')
            .where({ userId: currentEmail })
            .get();

          if (res.data) {
            console.log(`[Control] Cloud sync success: ${res.data.length} records`);
            
            const cloudRecords = res.data
                .map((item: any) => ({
                    id: item.id,
                    timestamp: item.timestamp,
                    challenge: item.challenge,
                    items: item.items || [],
                    summary: item.summary,
                    deletedAt: item.deletedAt
                })) as ControlRecord[];

            // Merge Logic
            const uniqueMap = new Map();
            cloudRecords.forEach(r => uniqueMap.set(r.id, r));
            get().records.forEach(r => {
                if (!uniqueMap.has(r.id)) {
                    uniqueMap.set(r.id, r);
                }
            });

            const mergedList = Array.from(uniqueMap.values()) as ControlRecord[];
            
            set({ 
              records: mergedList.sort((a, b) => b.timestamp - a.timestamp) 
            });
          }
        } catch (err) {
          console.error('[Control] Sync failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'control-observer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
