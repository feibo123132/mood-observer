Based on the "network request error" and the timeout logs visible in the screenshot (the first line says `请求在60s内未完成` - request not completed within 60s), the issue is clearly a **Timeout**.

The podcast generation process involves a real-time WebSocket connection to a TTS service, which can easily exceed 60 seconds for longer reports. However, both the Client SDK and the Cloud Function have hardcoded 60s limits.

I will implement the following fix:

1.  **Client-Side (Frontend)**:
    *   Modify `src/lib/cloudbase.ts`: Increase the global SDK timeout from `60000` (1 minute) to `300000` (5 minutes). This prevents the browser from killing the request prematurely.

2.  **Server-Side (Cloud Function)**:
    *   Modify `cloudfunctions/generatePodcast/index.js`: Increase the internal `setTimeout` from `60000` to `300000` (5 minutes) to allow the WebSocket session to run longer.
    *   *Note: You may also need to update the function's timeout configuration in the Tencent Cloud Console to match (default is usually 3-5s, but needs to be 60s+).*

3.  **Error Handling Optimization**:
    *   Modify `src/pages/HistoryReportsPage.tsx`: Improve the error message to explicitly mention "Timeout" if the error message contains "timeout" or "network", guiding the user to try shorter text if needed.

This approach addresses the root cause shown in the screenshot ("60s timeout").

### Plan Checklist:
- [ ] Update `src/lib/cloudbase.ts` timeout to 300s.
- [ ] Update `cloudfunctions/generatePodcast/index.js` internal timeout to 300s.
- [ ] Enhance error handling in `HistoryReportsPage.tsx`.