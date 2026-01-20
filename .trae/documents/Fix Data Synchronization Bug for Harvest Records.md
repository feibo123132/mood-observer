I have identified the cause of the issue.

### **Root Cause Analysis**
The issue lies in the **cloud data synchronization logic** within `src/store/useMoodStore.ts`.
1.  When you create a "Harvest" (Treasure Journey) record, it is saved correctly locally and uploaded to the cloud with `type: 'harvest'`.
2.  However, in the `syncFromCloud` function, when the app retrieves data back from the cloud, it **explicitly filters/maps the fields** and omits the `type` property.
3.  As a result, the downloaded record loses its `type: 'harvest'` tag.
4.  In `CalendarPage.tsx`, any record without a specific `harvest` type defaults to the "Mood Forest" section.

### **Proposed Fix**
I will modify `src/store/useMoodStore.ts` to ensure the `type` field is correctly included when processing data fetched from the cloud.

**File:** `src/store/useMoodStore.ts`
```typescript
// Current Code (L96-L102)
const cloudRecords = res.data.map((item: any) => ({
  id: item.id,
  score: item.score,
  note: item.note,
  timestamp: item.timestamp,
  deletedAt: item.deletedAt, 
})) as MoodRecord[];

// Fixed Code
const cloudRecords = res.data.map((item: any) => ({
  id: item.id,
  score: item.score,
  note: item.note,
  timestamp: item.timestamp,
  deletedAt: item.deletedAt,
  type: item.type, // <--- Add this line to preserve record type
})) as MoodRecord[];
```

This change will ensure that "Treasure Journey" records retain their identity after syncing and appear in the correct section.
