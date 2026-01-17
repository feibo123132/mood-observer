I will implement the dual-system "Mood Pavilion" and "Harvest Treasure Box" following your architectural requirements.

**Plan:**

1.  **Update Data Model (`src/types/index.ts`)**:
    *   Add `type?: 'mood' | 'harvest'` to the `MoodRecord` interface.
    *   **No new `harvestLevel` field**: As requested, we will reuse the `score` field.
        *   For Harvest mode, `score` will be strictly one of: `0, 25, 50, 75, 100`.

2.  **Logic & Constants**:
    *   Define the Harvest Levels mapping:
        *   `0`: Common (普通) - White
        *   `25`: Fine (精良) - Green
        *   `50`: Rare (稀有) - Blue
        *   `75`: Epic (史诗) - Purple
        *   `100`: Legendary (传说) - Gold

3.  **Update `HomePage.tsx`**:
    *   **State**: Add `recordType` state to track 'mood' vs 'harvest'.
    *   **Modal Header**:
        *   Change "记录此刻" to "JIEYOU情绪亭" (default).
        *   Add a **Switch Icon** (e.g., a Box or Refresh icon) to the right.
        *   **Switch Logic**:
            *   Toggle `recordType`.
            *   Update Title to "JIEYOU开宝箱" (if harvest).
            *   **Reset Slider**: Set `score` to `50` (middle) immediately upon switching.
    *   **UI Rendering**:
        *   **Mood Mode**: Keep existing layout (Gradient Sphere, Continuous Slider, Score Text).
        *   **Harvest Mode**:
            *   **Sphere**: New solid-color sphere (no breathing/gradient).
            *   **Text**: Show Level Name (e.g., "😌 精良") and Description (e.g., "升职加薪...").
            *   **Hidden Score**: Do NOT show the numeric "SCORE: 50" text.
            *   **Slider**: Stepped slider (snaps to 0, 25, 50, 75, 100).
    *   **Saving**: Save with `type: recordType`.

4.  **Styles**:
    *   Ensure Harvest mode uses the specific colors (White, Green, Blue, Purple, Gold) for the sphere and slider elements.

This plan strictly adheres to your "architectural cleanliness" requirements by reusing the `score` field and implementing the specific frontend conversion logic.
