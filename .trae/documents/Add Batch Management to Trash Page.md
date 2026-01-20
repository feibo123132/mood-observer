I have analyzed the current implementation of `CalendarPage.tsx` and `TrashPage.tsx`. To add batch management and "one-click delete" functionality to the Trash page, I will replicate the logic from `CalendarPage.tsx`.

### **Plan**

#### **1. State Management (TrashPage.tsx)**
- Add `isSelectionMode` (boolean) state to toggle selection mode.
- Add `selectedIds` (Set<string>) state to track selected items.
- Add `toggleSelection` function to handle item selection/deselection.
- Add `handleBatchDelete` function to perform permanent deletion of selected items.
- Add `handleBatchRestore` function to perform restoration of selected items (since we are in Trash, bulk restore is also a logical feature).

#### **2. UI Updates (TrashPage.tsx)**
- **Header**: Add a "Batch Management" (CheckSquare) button to the right side of the header (similar to Calendar view).
- **List Items**:
  - Wrap list items to support `AnimatePresence` for checkbox animation.
  - Add a checkbox (CheckSquare/Square) to the left of each item, visible only when `isSelectionMode` is true.
  - Make the item card clickable to toggle selection when in selection mode.
- **Bottom Action Bar**:
  - Add a floating action bar at the bottom that appears when items are selected.
  - Include "Delete Selected" (Permanent Delete) button.
  - Include "Restore Selected" button (Bonus feature for better UX).

#### **3. Store Updates (useMoodStore.ts)**
- Although `deleteMultipleRecords` exists (soft delete), we need a `permanentDeleteMultipleRecords` for the trash page.
- We also need `restoreMultipleRecords` for the batch restore feature.
- I will check `useMoodStore.ts` again. The previous search result showed `deleteMultipleRecords` (soft delete). I need to add:
    - `permanentDeleteMultipleRecords(ids: string[])`
    - `restoreMultipleRecords(ids: string[])`

### **Step-by-Step Implementation**

1.  **Modify `src/store/useMoodStore.ts`**:
    - Add `permanentDeleteMultipleRecords` action.
    - Add `restoreMultipleRecords` action.
2.  **Modify `src/pages/TrashPage.tsx`**:
    - Import `CheckSquare`, `Square` icons.
    - Implement `isSelectionMode`, `selectedIds` state.
    - Add toggle button in header.
    - Update list rendering to show checkboxes.
    - Add bottom floating bar with "Delete" and "Restore" actions.

### **Verification**
- Enter Trash page.
- Click batch management icon.
- Select multiple items.
- Click "Delete Selected" -> Verify items are gone forever.
- Click "Restore Selected" -> Verify items disappear from Trash and reappear in Calendar.
