# Implementation Plan: Treasure Box & Trouble Surgery

## 1. Page Structure & Routing
- **New Page**: `src/pages/TreasureBoxPage.tsx`
    - Main dashboard for tools.
    - Currently contains one card: "烦恼手术 (Trouble Surgery)".
    - Also displays a list of past "Surgery Reports" (History).
- **New Page**: `src/pages/TroubleSurgeryPage.tsx`
    - The interactive wizard interface.
- **Routing**: Update `src/App.tsx` to include routes:
    - `/treasure-box`
    - `/treasure-box/trouble-surgery`

## 2. Data Storage (Independent Archiving)
- **Store Update**: Extend `useMoodStore` (or create `useTreasureStore` if preferred, but extending is simpler for now) to handle `surgeryRecords`.
- **Data Structure**:
    ```typescript
    interface SurgeryRecord {
      id: string;
      timestamp: number;
      trouble: string; // The initial automatic thought
      evidence: { support: string; against: string };
      alternative: string;
      implication: string;
      utility: string;
      distancing: string;
      plan: string;
      newThought: string; // The result/conclusion
    }
    ```

## 3. "Trouble Surgery" Wizard Logic
- **Steps**:
    0. **Intro**: Input the "Automatic Thought" (Initial Trouble).
    1. **Evidence**: "Fact or Opinion?" (Support vs Against).
    2. **Alternative**: "Other possibilities?".
    3. **Implication**: "Worst case scenario?".
    4. **Utility**: "Is this helpful?".
    5. **Distancing**: "What would you tell a friend?".
    6. **Plan**: "Actionable steps".
    7. **Summary**: Review all answers and generate a "New Thought".
- **UI**:
    - Progress bar (Step X/7).
    - Previous/Next navigation.
    - "Save & Finish" at the end.

## 4. Implementation Steps
1.  **Define Types & Store**: Update `types/index.ts` and `store/useMoodStore.ts`.
2.  **Create Components**:
    - `TreasureBoxPage`: Grid layout for tools + History list.
    - `TroubleSurgeryPage`: State machine for wizard steps.
3.  **Wire up Routing**: Add to `App.tsx`.
4.  **Polish**: Add animations (framer-motion) for smooth transitions between steps.
