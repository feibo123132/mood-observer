I have researched the codebase and identified the necessary changes to implement the new scoring logic for "Treasure Journey" (Harvest mode).

### **Plan Overview**
The goal is to update the scoring range to start from 60 and redistribute the score segments (Ordinary, Fine, Rare, Epic, Legendary). This involves changes to the utility logic and the UI rendering of the sliders.

### **Detailed Steps**

#### **1. Update Logic Definitions**
**File:** `src/utils/harvestUtils.ts`
- Update `HARVEST_LEVELS` to reflect the new ranges:
  - **Ordinary (普通)**: 60 - 69 (Previously 0-69)
  - **Fine (精良)**: 70 - 79
  - **Rare (稀有)**: 80 - 89
  - **Epic (史诗)**: 90 - 95
  - **Legendary (传说)**: 96 - 100

#### **2. Update UI Implementation**
The slider UI needs to be updated in two places: `HomePage.tsx` (New Record) and `RecordEditModal.tsx` (Edit Record).

**File:** `src/pages/HomePage.tsx`
- **Update Slider Range**: Change `min="0"` to `min="60"`.
- **Update Segment Widths**: The total range is now 40 points (100 - 60).
  - Ordinary (10 pts): `25%` (10/40)
  - Fine (10 pts): `25%` (10/40)
  - Rare (10 pts): `25%` (10/40)
  - Epic (6 pts): `15%` (6/40)
  - Legendary (4 pts): `10%` (4/40)
- **Update Thumb Position**: Adjust the `left` style calculation from `${recordScore}%` to `${(recordScore - 60) / 40 * 100}%` to map the 60-100 score correctly to the 0-100% visual width.

**File:** `src/components/RecordEditModal.tsx`
- **Update Slider Range**: Change `min="0"` to `min="60"`.
- **Update Segment Widths**: Apply the same percentages as above (25%, 25%, 25%, 15%, 10%).
- **Update Thumb Position**: Adjust the `left` style calculation similarly: `${(score - 60) / 40 * 100}%`.

### **Verification Strategy**
- Create a new "Treasure Journey" record and verify the slider starts at 60.
- Check if dragging the slider correctly maps to the new color segments.
- Verify that "Epic" starts at 90 and "Legendary" starts at 96.
