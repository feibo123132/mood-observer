---
name: "handle-api-timeout"
description: "Solves 504 Gateway Timeout in long-running cloud functions (e.g. AI generation) using DB persistence and async retry patterns. Invoke when user encounters timeout/network errors or needs to handle long tasks."
---

# Handle API Gateway Timeout (Async Result Pattern)

This skill provides a proven solution for handling "504 Gateway Timeout" and "CORS Error" issues when invoking long-running cloud functions (e.g., DeepSeek/OpenAI generation tasks > 60s).

## Problem Diagnosis
When a Cloud Function runs longer than the API Gateway timeout (typically 60s):
1.  **Frontend**: Receives `504 Gateway Timeout` or `net::ERR_FAILED`.
2.  **Browser Console**: Often shows `CORS Policy Error` (No 'Access-Control-Allow-Origin') because the timeout error response from the gateway lacks proper CORS headers.
3.  **Backend**: The function **continues running** in the background until its own execution timeout (e.g., 180s/300s) is reached, or it gets killed by the platform.

## Solution Pattern: "Check-Run-Save" (Async Persistence)

Do not rely on the HTTP response of the long-running request. Instead, use the database as a bridge.

### 1. Cloud Function Implementation (Backend)

Modify the function to check for existing results before starting work, and save results after finishing.

**CRITICAL UPDATE**: Add a `checkOnly` mode to prevent API waste during retries.

```javascript
const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const db = app.database();
const COLLECTION_NAME = 'your_task_results';

exports.main = async (event, context) => {
  const { uniqueId, checkOnly } = event; // checkOnly flag prevents re-running logic

  // STEP 1: Idempotency Check (Cache Hit)
  // Before starting heavy work, check if result already exists
  try {
    const res = await db.collection(COLLECTION_NAME).where({ uniqueId }).limit(1).get();
    if (res.data && res.data.length > 0) {
      return { success: true, data: res.data[0].result, fromCache: true };
    }
  } catch (e) { /* Ignore DB errors */ }

  // STEP 1.5: Check Only Mode (Stop here if retrying)
  if (checkOnly) {
    return { success: false, status: 'pending', message: 'Result not ready' };
  }

  // STEP 2: Execute Long-Running Task
  // (e.g., Call AI API with 180s timeout)
  const aiResult = await callDeepSeekAPI(event.data);

  // STEP 3: Persistence (Save Result)
  // Save the result so subsequent retries can find it
  try {
    await db.collection(COLLECTION_NAME).add({
      uniqueId,
      result: aiResult,
      createdAt: new Date()
    });
  } catch (e) { console.error("Save failed", e); }

  return { success: true, data: aiResult };
};
```

### 2. Frontend Implementation (React)

Handle the timeout error gracefully and allow the user to "pick up" the result later.

```typescript
const handleLongTask = async () => {
  try {
    // Pass checkOnly=true if we are in retry mode
    await app.callFunction({ 
      name: 'longTask', 
      data: { ..., checkOnly: isRetryMode } 
    });
    // Success handling...
  } catch (error) {
    const msg = error.message || '';
    
    // STEP 4: Catch Timeout
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('504')) {
      // Switch UI to "Retry/Check Result" mode
      setRetryMode(true); 
      alert('Request timed out, but task is running in background. Please wait a moment and click "Check Result".');
    } else {
      alert('Error: ' + msg);
    }
  }
};

// UI Button Logic
<button onClick={handleLongTask}>
  {isLoading ? 'Processing...' : (retryMode ? 'Check Result' : 'Start Task')}
</button>
```

### 3. Configuration Checklist
- **Cloud Function Timeout**: Set `timeout` in `cloudbaserc.json` or console to max allowed (e.g., 180s, 300s, or 900s) to ensure the background process completes.
- **Database Collection**: Ensure the collection (e.g., `design_reports`) exists.

## When to Use
- User reports "Network Error" or "504" on AI features.
- User asks to increase timeout limits > 60s.
- Implementing Generative AI features (Text-to-HTML, Podcast Generation).
