I will fix the issue where "Check Result" repeatedly consumes API quota without finding the result, and guide you to solve the root cause (function timeout).

**Plan:**

1.  **Stop API Waste (Code Update)**:
    *   **Backend (`cloudfunctions/designReport/index.js`)**: Add a `checkOnly` mode. When enabled, it *only* checks the database. If no result is found, it returns "pending" instead of calling DeepSeek again.
    *   **Frontend (`src/pages/HistoryReportsPage.tsx`)**:
        *   Update the "Check Result" button to send `checkOnly: true`.
        *   If the check returns "pending/not found", show a specific alert: "Result not found yet. It may have failed or is still running." and offer a way to "Force Retry" (which calls API again).

2.  **Fix Root Cause (User Action)**:
    *   **Timeout Mismatch**: Your screenshots confirm a 504 Gateway Timeout (60s). However, for the data to be saved, the *function execution* must continue in the background. If the platform kills the function at 60s (default), the API call finishes but the "Save to DB" code never runs.
    *   **Solution**: You *must* manually verify/update the function timeout in the **Tencent Cloud Console** to **300 seconds** (or 900s). The `cloudbaserc.json` file is only a config; if it wasn't deployed or applied correctly, the console setting rules.
    *   **Missing Collection**: You *must* ensure the `design_reports` collection exists in the database.

3.  **Refined Logic Flow**:
    *   User clicks "Content Visualization" -> Calls API.
    *   Timeout (504) happens -> UI shows "Check Result".
    *   User clicks "Check Result" -> **Calls with `checkOnly: true`**.
    *   Cloud Function checks DB.
        *   Found? -> Return HTML. (Success)
        *   Not Found? -> Return "Pending". (API NOT called, quota saved).
    *   Frontend sees "Pending" -> Tells user "Still waiting or failed. Try again?"

This approach stops the "infinite API consumption" loop while you fix the platform timeout settings.