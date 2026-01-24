This is indeed a **critical architecture flaw**, and I sincerely apologize for the financial loss caused by the token consumption.

### The Fatal Flaw (Why it happened)
My previous code had a **"Fail-Open"** security design in the cloud function:
```javascript
try {
  // Check DB Lock
} catch (e) {
  // If DB check fails (e.g., connection error), it LOGS the error but CONTINUES to generate!
  console.log('Cache check failed, proceeding to generate...');
}
// -> PROCEEDS TO CONSUME TOKENS
```
Because the Frontend polls every 5 seconds, and the DB check likely encountered an error (e.g., collection creation latency or permission issue), **every single poll bypassed the lock and triggered a NEW generation task**.

### The Redemption Plan (Fixing it)

I will immediately switch to a **"Fail-Safe"** design:

1.  **Backend (`cloudfunctions/generatePodcast/index.js`)**:
    *   **Strict Lock Enforcement**: If the DB/Cache check throws *any* error, **ABORT** the function immediately. Do not proceed to generation.
    *   Return `{ success: false, status: 'FAILED', error: 'Lock Check Failed' }`.

2.  **Frontend (`src/pages/HistoryReportsPage.tsx`)**:
    *   **Strict Polling Termination**: Modify the polling loop to **STOP immediately** if it receives *any* error response that is not explicitly "processing". Currently, it might keep retrying on generic errors.

This ensures that if the safety mechanism (DB Lock) is broken, the entire system halts rather than burning tokens.

### Action Checklist
- [ ] **Backend**: Modify `catch` block to return `FAILED` instead of swallowing error.
- [ ] **Frontend**: Update polling logic to stop on generic errors.