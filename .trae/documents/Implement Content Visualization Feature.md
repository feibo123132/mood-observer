I will implement the "Content Visualization" feature in `src/pages/HistoryReportsPage.tsx` following the provided instructions.

**Plan:**

1.  **State Management**:
    *   Add `isDesigning` (boolean) to track the loading state of the design generation.
    *   Add `reportHtml` (string | null) to store the generated HTML content.

2.  **Logic Implementation (`handleDesignReport`)**:
    *   Create an asynchronous function `handleDesignReport(content: string)`.
    *   Inside this function:
        *   Set `isDesigning` to `true`.
        *   Perform anonymous authentication (`app.auth().signInAnonymously()`).
        *   Call the cloud function `designReport` with `reportText: content`.
        *   Handle the response: if successful, set `reportHtml`; otherwise, show an alert.
        *   Handle errors (including network timeouts) gracefully.
        *   Reset `isDesigning` to `false` in `finally`.

3.  **UI Updates**:
    *   **Button**: Update the "Content Visualization" button in the sidebar.
        *   Bind the `onClick` event to `handleDesignReport`.
        *   Show a loading spinner (`Loader2`) and change text to "Designing..." when `isDesigning` is true.
        *   Disable the button while processing.
    *   **Result Modal**: Add a new full-screen Modal component.
        *   Render it when `reportHtml` is not null.
        *   Include a header with a "Close" button.
        *   Use an `<iframe>` with `srcDoc={reportHtml}` to safely display the generated design.
        *   Set appropriate sandbox attributes (`allow-scripts allow-same-origin`) to ensure the design renders correctly but safely.

This implementation directly fulfills the requirements to connect the button to the cloud function and display the result.