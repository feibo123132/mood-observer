---
name: "resolve-build-errors"
description: "Diagnoses and fixes common build/deploy failures (TypeScript errors, duplicate keys, library type mismatches). Invoke when user reports 'build failed', 'github action failed', or 'deploy error'."
---

# Resolve Build & Deployment Errors

This skill provides a systematic approach to fixing build failures that often occur in CI/CD environments (like GitHub Actions) even when local dev servers seem fine.

## Common Error Patterns & Fixes

### 0. File Casing Mismatches
**Error**: `Cannot find module '.../MyComponent'`
**Cause**: The CI/CD environment (Linux) is case-sensitive, but your local OS (Windows/macOS) is not. Your file might be named `mycomponent.tsx` but you imported it as `MyComponent`.
**Fix**:
1. Ensure the import path's casing **exactly** matches the actual file name.
2. If the file name needs to be changed in Git, use `git mv` to force Git to recognize the case change.

### 1. Duplicate Object Properties
**Error**: `An object literal cannot have multiple properties with the same name.`
**Cause**: Copy-pasting code blocks or merging configurations without cleaning up.
**Fix**:
1.  Locate the file and line number from the build log.
2.  Scan the object literal for duplicate keys (e.g., two `color:` properties).
3.  Remove the redundant property (usually the first one is outdated, keep the second/intended one, or merge them).

### 2. Missing Type Definitions
**Error**: `Property 'x' does not exist on type 'Y'.`
**Cause**: Using a new property in a component (e.g., `date`) that hasn't been added to the shared TypeScript interface.
**Fix**:
1.  Find the interface definition (usually in `src/types/index.ts` or similar).
2.  Add the missing property.
3.  **Best Practice**: Mark it as optional (`?`) if it's not guaranteed to be present in all legacy data.
    ```typescript
    export interface MoodRecord {
      // ... existing fields
      date?: string; // Add this
    }
    ```

### 3. Library Type Mismatches (e.g., Recharts)
**Error**: `Type '(a, b, c) => void' is not assignable to type 'HandlerType'.` or `Expected X arguments, got Y.`
**Cause**: Strict TypeScript definitions in libraries often conflict with practical usage, especially for event handlers.
**Fix**:
1.  **Simplify**: Check if the handler is even necessary. (e.g., Does the parent component already handle the click?)
2.  **Remove Redundancy**: If a child component (like `<Area>`) has a handler that conflicts, but the parent (`<AreaChart>`) has a working global handler, remove the child's handler.
3.  **Cast to Any** (Last Resort): If functionality is correct but types are wrong, cast the handler or arguments to `any` to unblock the build.

## Workflow for "GitHub Upload Failed"

1.  **Read the Logs**: Don't guess. Ask the user for the error log or screenshot of the "Annotations" / "Build" step.
2.  **Isolate the File**: Identify which file is causing the build break.
3.  **Apply Pattern**: Match the error to one of the above patterns.
4.  **Fix & Verify**: Apply the code change. If possible, run `npm run build` locally to verify before asking user to push again.
