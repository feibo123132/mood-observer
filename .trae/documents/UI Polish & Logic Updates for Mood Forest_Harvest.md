I have analyzed the request and identified the necessary changes across three files.

### **Plan Overview**

1.  **Bold Font for Mood Forest Text**:
    *   **Target**: `src/components/MoodSlider.tsx`
    *   **Action**: Change the font weight of the label text from `font-light` to `font-bold` to match the "Treasure Journey" style.

2.  **Sort Mood Summary by Score**:
    *   **Target**: `src/hooks/useMoodStats.ts`
    *   **Action**: Modify the sorting logic for `getMoodDistribution`. Instead of sorting by `count` (frequency), I will sort by `score` (descending), so higher mood states (like "Peak/Ecstasy") always appear at the top, followed by lower ones.

3.  **Editable Score Input for Treasure Journey**:
    *   **Target**: `src/pages/HomePage.tsx`
    *   **Action**: In the "Harvest" (Treasure Journey) section, add an editable number input field similar to the one in `MoodSlider`.
    *   **Details**:
        *   Insert the `SCORE: <input ... />` JSX block below the level label.
        *   Ensure the input is bound to `recordScore` and handles changes correctly (clamping between 60-100).
        *   Style it to match the `MoodSlider` input (font-mono, border-b, etc.).

### **Step-by-Step Implementation**

1.  **Modify `MoodSlider.tsx`**: Update `className` for the label div.
2.  **Modify `useMoodStats.ts`**: Update the `sort` function in `getMoodDistribution`. I'll need to map mood labels back to a representative score or priority to sort them correctly. Since `MoodState` doesn't explicitly store a "base score" in the distribution object, I might need to infer it or adjust the data structure slightly to enable score-based sorting.
    *   *Refinement*: The distribution object keys are `label`. I can use `getMoodState` or a helper to determine the hierarchy. A simpler way is to define a priority map for labels.
3.  **Modify `HomePage.tsx`**: Copy the input logic from `MoodSlider` and adapt it for the Harvest section (min=60, max=100).

### **Verification Strategy**
- Check if Mood Forest text is bold.
- Check if Mood Summary list is ordered by mood intensity (highest first).
- Check if Treasure Journey score is editable via keyboard input.
