I will fix the issues where Mood and Harvest modes share the same note input, and Harvest records look like Mood records in the Calendar view.

**Plan:**

1.  **Separate Note State (`HomePage.tsx`)**:
    *   Instead of a single `recordNote` state, I will implement `moodNote` and `harvestNote` (or a state object keyed by type) to ensure text entered in one mode doesn't persist when switching to the other.

2.  **Update Calendar View (`CalendarPage.tsx`)**:
    *   Modify the record list rendering to check `record.type`.
    *   If `record.type === 'harvest'`, use `getHarvestLevel(record.score)` to determine the label and color, instead of `getMoodState`.
    *   Update the visual presentation for Harvest records (e.g., maybe show the 'Map' icon or distinct styling).

3.  **Update Edit Modal (`RecordEditModal.tsx`)**:
    *   Add logic to detect if the record being edited is a 'harvest' record.
    *   If it is 'harvest':
        *   Use `getHarvestLevel` for colors and labels in the header.
        *   Render the **Harvest Slider** (stepped/segmented) instead of the continuous Mood slider.
        *   Ensure the score update logic respects the harvest levels (0, 25, 50, 75, 100) or ranges if we kept ranges (current logic uses ranges for display but slider was segmented in HomePage, I should align this). *Self-correction: The user approved ranges for levels but we used step=1 slider in HomePage. I will use the continuous slider for Harvest in Edit Modal too, but with Harvest colors.*

This will ensure "Harvest" records feel distinct and "Harvest" mode has its own independent scratchpad.
