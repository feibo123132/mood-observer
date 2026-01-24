To solve the "12 retries" problem and improve the "Bad Experience" for long reports, I will implement a **Database-Backed Task Locking Mechanism**.

### The Problem
Currently, when the first request times out (but keeps running), subsequent clicks on "Retry" trigger **parallel generation tasks** because the file doesn't exist yet. This causes:
1.  Wasted resources (12x cost).
2.  Race conditions.
3.  Bad UX (user clicks blindly).

### The Solution: "Task Locking"
We will use the existing `mood_records` collection (or creating a new `podcast_tasks` collection is cleaner, but let's check if we can just use a dedicated collection `podcast_tasks` to avoid polluting user records). Since `db` is available in `useMoodStore`, we can access it.

**Plan:**

1.  **Backend (`cloudfunctions/generatePodcast/index.js`)**:
    -   **Step 1**: Calculate a `taskKey` based on `year-week`.
    -   **Step 2**: Query a new DB collection `podcast_tasks` for this key.
        -   If `status === 'PROCESSING'`, return `{ success: false, status: 'processing', message: 'Generating in background...' }` immediately.
        -   If `status === 'COMPLETED'`, return the saved `audioUrl`.
    -   **Step 3**: If no record, insert `{ _id: taskKey, status: 'PROCESSING', createdAt: db.serverDate() }`.
    -   **Step 4**: Proceed with generation.
    -   **Step 5**: On success, update DB to `{ status: 'COMPLETED', audioUrl: ... }`.
    -   **Step 6**: On error, update DB to `{ status: 'FAILED' }`.

    *Wait, simpler approach for "Quick Fix" without DB schema migration:*
    We can just rely on **Cloud Storage "Lock File"**.
    - Upload a small JSON file `reports/podcast_{year}_{week}.lock` when starting.
    - If lock file exists and is recent (< 5 mins), return "Processing".
    - **Decision**: DB is better because lock files on storage can be tricky with consistency/race conditions. But for this project, `podcast_tasks` collection is safest.

    **Actually, even simpler:**
    The user already has `reports` in `useMoodStore`.
    I will update `HistoryReportsPage.tsx` to handle the "Processing" state *locally* better, but that doesn't solve the server-side re-triggering if the user refreshes.
    
    **Let's go with the DB Locking on Backend.**
    1.  Initialize `db` in cloud function.
    2.  Check/Create `podcast_tasks` record.

2.  **Frontend (`HistoryReportsPage.tsx`)**:
    -   Handle the `status: 'processing'` response.
    -   If receiving "processing", show a "Generating..." toast and **automatically retry/poll** after 5 seconds, instead of making the user click.
    -   Add a **Polling Mechanism**: `useInterval` or simple `setTimeout` loop when in `retryMode`.

### Checklist
- [ ] **Backend**: Add DB State Tracking to `generatePodcast`.
- [ ] **Frontend**: Add Auto-Polling logic to `HistoryReportsPage` so user doesn't need to click 12 times.

This will turn the "12 clicks" into "1 click + 1 minute wait", which is the correct experience.