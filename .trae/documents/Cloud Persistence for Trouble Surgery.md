# Implementation Plan: Cloud Persistence for Trouble Surgery

## 1. Store Architecture Upgrade
- **Create New Store**: `src/store/useSurgeryStore.ts`
    - Purpose: Decouple surgery records from `useMoodStore` to keep logic clean.
    - Features:
        - State: `surgeryRecords: SurgeryRecord[]`, `isSyncing: boolean`.
        - Actions: `addRecord`, `syncFromCloud`, `deleteRecord` (optional for now), `clearLocalData`.
    - Persistence: Use `zustand/persist` with `localStorage` (key: `surgery-observer-storage`).

## 2. CloudBase Integration (`socratic_records`)
- **Collection Name**: `socratic_records` (as requested).
- **Data Structure (Cloud)**:
    ```typescript
    interface CloudSurgeryRecord {
      id: string;          // UUID
      userId: string;      // Email/User Identifier
      issue: string;       // Mapped from local `trouble`
      dialogue: {          // Mapped from local fields
        evidence: { support: string; against: string };
        alternative: string;
        implication: string;
        utility: string;
        distancing: string;
        plan: string;
      };
      conclusion: string;  // Mapped from local `newThought`
      timestamp: number;   // Date.now()
      createTime: string;  // ISO String (Readable)
      deletedAt?: number;  // Soft delete support
    }
    ```
- **Sync Logic**:
    - **Upload**: On `addRecord`, push to CloudBase immediately.
    - **Download**: On `syncFromCloud`, fetch where `userId == currentUser`.
    - **Merge**: Use `Map` to merge local and cloud records by `id`.

## 3. Data Migration (One-time)
- **Strategy**: When `useSurgeryStore` initializes or first syncs, check if `useMoodStore` has `surgeryRecords`.
- **Action**:
    1. Read from `useMoodStore`.
    2. Add to `useSurgeryStore`.
    3. Clear from `useMoodStore` (to avoid duplication).
    4. Trigger cloud sync for these migrated records.

## 4. Component Updates
- **TreasureBoxPage**: Switch `useMoodStore` -> `useSurgeryStore`.
- **TroubleSurgeryPage**: Switch `useMoodStore` -> `useSurgeryStore`.
- **SurgeryHistoryPage**: Switch `useMoodStore` -> `useSurgeryStore`.
- **App.tsx**: Add `useSurgeryStore.getState().syncFromCloud()` in the auth effect.

## 5. Execution Steps
1.  **Create** `src/store/useSurgeryStore.ts` with full sync logic.
2.  **Modify** `src/App.tsx` to trigger sync on login.
3.  **Refactor** 3 pages to use the new store.
4.  **Clean up** `useMoodStore` (remove `surgeryRecords` definition after migration logic is verified, or keep it deprecated for safety).
