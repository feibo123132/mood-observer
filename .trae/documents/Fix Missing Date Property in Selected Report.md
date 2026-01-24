I will fix the white screen error caused by `selectedReport.date` being undefined in `HistoryReportsPage.tsx`.

### The Problem
The error `Uncaught TypeError: Cannot read properties of undefined (reading 'replace')` occurs at line 315:
`<p className="text-xs text-slate-400">{selectedReport.date.replace('第', '第 ')}</p>`

This happens because `selectedReport` state object structure is inconsistent.
In `sortedReports` mapping (line 64):
`return { key, year, week, content };` -> **`date` property is missing!**

However, the `selectedReport` state definition (line 14) expects:
`const [selectedReport, setSelectedReport] = useState<{key: string, content: string, date: string} | null>(null);`

When clicking a report (line 107):
`onClick={() => setSelectedReport({ key: report.key, content: report.content })}` -> **`date` property is missing here too!**

So when the modal tries to access `selectedReport.date.replace(...)`, it crashes.

### The Solution
1.  **Update `sortedReports`**: Calculate and include the `date` property (e.g., "2024年 第5周") in the mapped object.
2.  **Update `onClick` handler**: Pass the full report object (including `date`) to `setSelectedReport`.

### Implementation Steps
1.  Modify `src/pages/HistoryReportsPage.tsx`:
    *   In `sortedReports` useMemo, add `date: \`\${year}年 第\${week}周\`` to the returned object.
    *   In the `onClick` handler for the report card, pass `...report` or explicitly include `date`.

This will ensure `selectedReport.date` is always defined when the modal opens.