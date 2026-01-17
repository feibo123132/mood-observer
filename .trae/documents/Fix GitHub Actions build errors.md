I will fix the build errors encountered in GitHub Actions.

**Plan:**

1.  **Fix Case Sensitivity**: Rename `src/components/aireportcard.tsx` to `src/components/AIReportCard.tsx` to match the import in `ReviewPage.tsx`.
2.  **Fix Type Definitions**:
    *   Update `src/types/index.ts` to include `deletedAt` in `MoodRecord` and define `AudioMode`.
    *   Update `src/store/useSettingsStore.ts` and `src/services/AudioPlayer.ts` to use the shared `AudioMode` type.
3.  **Fix Logic Errors**:
    *   Update `src/components/RecordEditModal.tsx` to ensure `moodState` always has an `emoji` property (adding a default for harvest records).
    *   Update `src/components/AIReportModal.tsx` to resolve the `timeout` type error in the cloud function call.
