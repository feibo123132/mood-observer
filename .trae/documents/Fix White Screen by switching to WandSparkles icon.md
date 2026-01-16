I will replace the `Wand2` icon with `WandSparkles` in both `src/components/aireportcard.tsx` and `src/components/CustomPromptModal.tsx`. 

This change addresses the "White Screen" crash (ReferenceError) by:
1.  Using a different, verified icon (`WandSparkles`) that fits the "magic" theme perfectly.
2.  Forcing a fresh compilation/update to resolve any potential caching or import issues with the previous `Wand2` usage.

**Plan Steps:**
1.  Edit `src/components/aireportcard.tsx`: Change `Wand2` to `WandSparkles` in imports and usage.
2.  Edit `src/components/CustomPromptModal.tsx`: Change `Wand2` to `WandSparkles` in imports and usage.
