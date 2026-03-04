---
name: "trash-bin-manager"
description: "Implements a Recycle Bin/Trash feature with soft deletion, 7-day auto-expiry, and restore capabilities. Invoke when user wants to add 'undo delete', 'trash bin', or 'soft delete' functionality."
---

# Trash Bin Manager (Soft Delete Pattern)

This skill provides a standardized implementation for a "Recycle Bin" feature, allowing users to restore deleted items and automatically cleaning up old data.

## 1. Core Logic (Store Layer)

### Concept
Instead of physically removing data from the database, we use a **Soft Delete** strategy by marking a `deletedAt` timestamp.

### State Interface
Add the following to your Store interface:

```typescript
interface StoreState {
  // ... existing state
  deleteRecord: (id: string) => Promise<void>; // Soft delete
  restoreRecord: (id: string) => Promise<void>; // Restore
  permanentDeleteRecord: (id: string) => Promise<void>; // Hard delete
  cleanupTrash: () => void; // Auto-delete expired items
}
```

### Implementation Pattern (Zustand Example)

```typescript
// 1. Soft Delete
deleteRecord: async (id) => {
  const now = Date.now();
  // Optimistic Update
  set((state) => ({
    records: state.records.map((r) => r.id === id ? { ...r, deletedAt: now } : r)
  }));
  // Sync to Cloud
  await db.collection('records').where({ id }).update({ deletedAt: now });
},

// 2. Restore
restoreRecord: async (id) => {
  set((state) => ({
    records: state.records.map((r) => r.id === id ? { ...r, deletedAt: undefined } : r)
  }));
  const _ = db.command;
  await db.collection('records').where({ id }).update({ deletedAt: _.remove() });
},

// 3. Auto-Cleanup (7 Days Expiry)
cleanupTrash: () => {
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  
  const { records, permanentDeleteRecord } = get();
  records.forEach(r => {
    if (r.deletedAt && (now - r.deletedAt > SEVEN_DAYS)) {
      permanentDeleteRecord(r.id); // Trigger hard delete
    }
  });
}
```

## 2. UI/UX Guidelines

### Trash Page
-   **Filter**: Only show items where `deletedAt` is NOT null.
-   **Display**: Show a "Days Remaining" countdown (e.g., "Expires in 6 days").
    -   Formula: `Math.ceil((deletedAt + 7_DAYS - now) / ONE_DAY_MS)`
-   **Actions**: Provide "Restore" (♻️) and "Delete Forever" (🗑️) buttons for each item.
-   **Empty State**: "Trash is empty."

### Main List
-   **Filter**: Only show items where `deletedAt` is undefined or null.

### Auto-Cleanup Trigger
-   Call `cleanupTrash()` in the app's initialization logic (e.g., inside `useEffect` in `App.tsx` or `HomePage.tsx`).

## 3. Database Indexing
-   Ensure you index the `deletedAt` field in your database for efficient filtering.

## 4. Example: "Days Remaining" Helper

```typescript
const getDaysRemaining = (deletedAt: number) => {
  const expiryDate = deletedAt + (7 * 24 * 60 * 60 * 1000);
  const diff = expiryDate - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return days > 0 ? days : 0;
};
```
