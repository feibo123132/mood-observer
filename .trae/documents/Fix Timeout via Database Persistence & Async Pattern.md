I will fix the timeout and CORS issues by implementing a database-backed asynchronous pattern and optimizing the cloud function.

**Plan:**

1.  **Enhance Cloud Function (`cloudfunctions/designReport/index.js`)**:
    *   Initialize CloudBase Database (`db`).
    *   Add **idempotency check**: Before generating, check the `design_reports` collection for an existing report (matched by `year` and `week`).
    *   If a report exists, return it immediately (solving the retry/polling issue).
    *   If not, proceed with DeepSeek generation (with `temperature` lowered to 1.0 for stability).
    *   After generation, **save the HTML to the database**.
    *   This ensures that if the first request times out (504) but the function keeps running, the *next* request will find and return the result.

2.  **Update Dependencies (`cloudfunctions/designReport/package.json`)**:
    *   Add `@cloudbase/node-sdk` to ensure database access works.

3.  **Update Frontend Logic (`src/pages/HistoryReportsPage.tsx`)**:
    *   Update `handleDesignReport` to accept `year` and `week`.
    *   Update the button click handler to pass these parameters.
    *   Implement **Retry Mode**: If a network/timeout error occurs, change the button text to "Check Result" (similar to the Podcast feature). This allows the user to manually poll for the result after the background task finishes.

4.  **Configuration (`cloudbaserc.json`)**:
    *   Attempt to set a global function timeout (though this might require console action, it's good practice to document it in the config).

**User Action Required**:
*   You will need to create a collection named `design_reports` in your CloudBase Console Database. (I will verify this requirement in my final response).