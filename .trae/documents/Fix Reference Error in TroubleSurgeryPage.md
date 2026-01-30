# Fix Data Visibility in Surgery History Page

## Problem Analysis
The user cannot see the surgery records in the "Surgery History Book" page, even though the records exist in the database and are counted correctly on the main "Treasure Box" page.
- **Root Cause**: In `SurgeryHistoryPage.tsx`, the code attempts to access `state.surgeryRecords` from the store. However, the `useSurgeryStore` defines the state property as `records`, not `surgeryRecords`. This causes the component to receive `undefined` instead of the actual data array.

## Implementation Plan
I will update `src/pages/SurgeryHistoryPage.tsx` to correctly access the store state.

1.  **Correct Store Selector**:
    - Change `const surgeryRecords = useSurgeryStore((state) => state.surgeryRecords);` to `const records = useSurgeryStore((state) => state.records);`.

2.  **Update References**:
    - Rename the local variable `surgeryRecords` to `records` throughout the file to match the store's naming convention and ensure consistent data access in:
        - `useMemo` dependencies
        - `safeRecords` initialization
        - Debug data dump

## Verification
- After the fix, the `SurgeryHistoryPage` should correctly load the 2 existing records from the store.
- The calendar view should show indicators for dates with records.
- The list below the calendar should display the details of the records.