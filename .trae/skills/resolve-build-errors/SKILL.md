---
name: "resolve-build-errors"
description: "Diagnoses and fixes common build/deploy failures. Merges strategies for both code-level fixes (TypeScript, duplicates) and workflow-level guards (local build checks, type consistency). Invoke when user reports 'build failed', 'github action failed', or 'deploy error'."
---

# Resolve Build & Deployment Errors

This skill provides a unified strategy for ensuring successful builds and deployments, combining specific code-fix patterns with proactive workflow guards.

## 🎯 Proactive Guard: Before You Push (The "Deploy Guard" Protocol)

**Goal**: Catch errors locally so they never break the CI pipeline.

1.  **Type Consistency Check (Critical)**:
    *   **Problem**: Types defined in multiple places (e.g., `AudioMode` in both `store` and `services`) get out of sync.
    *   **Solution**: Use a **Single Source of Truth**. Define types in `src/types/index.ts` or a main store file, and import them everywhere. When modifying a type (e.g., adding `'friend'` mode), globally search to update all usages.
2.  **Local Build Simulation**:
    *   **Problem**: `pnpm dev` is permissive; GitHub Actions (`tsc -b && vite build`) are strict.
    *   **Solution**: **ALWAYS** run this locally before pushing:
        ```bash
        pnpm build
        ```
    *   If it fails here, it *will* fail on GitHub. Fix it locally first.

## 🛠️ Reactive Fixes: Common Error Patterns

If a build has already failed, use these patterns to diagnose and fix.

### 0. File Casing Mismatches
*   **Error**: `Cannot find module '.../MyComponent'`
*   **Cause**: Linux (CI) is case-sensitive; Windows/macOS (Local) are not.
*   **Fix**: Ensure import path casing **exactly** matches the filename. Use `git mv` if renaming files to change case.

### 1. Duplicate Object Properties
*   **Error**: `An object literal cannot have multiple properties with the same name.`
*   **Cause**: Merge conflicts or copy-pasting.
*   **Fix**: Locate the object, remove the redundant property (keep the intended/newer one).

### 2. Missing Type Definitions
*   **Error**: `Property 'x' does not exist on type 'Y'.`
*   **Cause**: Using a new field (e.g., `date`, `friend` mode) without updating the interface.
*   **Fix**: Find the interface definition and add the missing property. Mark as optional (`?`) if needed for legacy data compatibility.

### 3. Library Type Mismatches
*   **Error**: `Type '...' is not assignable to type 'HandlerType'.`
*   **Cause**: Strict library types conflicting with usage.
*   **Fix**: Simplify handlers, remove redundant ones, or (as a last resort) cast to `any` to unblock the build.

## 🧹 Code Quality: Common Linter Errors

Resolve these errors to maintain a clean codebase and pass `npm run lint`.

### 1. Unused References (`no-unused-vars`)
*   **Error**: `'variableName' is defined but never used`
*   **Cause**: Leftover variables from refactoring or imports that are no longer needed.
*   **Fix**:
    *   **Remove**: Delete the variable or import if it's truly not needed.
    *   **Ignore**: If it's a required parameter (e.g., in a callback), prefix it with `_` (e.g., `_req`).

### 2. Hooks Dependencies (`react-hooks/exhaustive-deps`)
*   **Error**: `React Hook useEffect has a missing dependency: '...'`
*   **Cause**: Using variables inside `useEffect`, `useMemo`, or `useCallback` without listing them in the dependency array. This can cause stale closures.
*   **Fix**:
    *   **Add Dependency**: Add the variable to the array `[var1, var2]`.
    *   **Refactor**: If adding it causes an infinite loop, check if the object/function is being recreated on every render. Wrap stable functions in `useCallback` or move them outside the component.
    *   **Disable (Use with Caution)**: `// eslint-disable-next-line react-hooks/exhaustive-deps` (Only if you are 100% sure you want the effect to run only once or ignore updates).

### 3. Explicit Any (`no-explicit-any`)
*   **Error**: `Unexpected any. Specify a different type`
*   **Cause**: Using `any` bypasses TypeScript's safety checks.
*   **Fix**:
    *   **Define Type**: Create an interface for the data structure.
    *   **Use Generic**: Use `unknown` if the type is truly uncertain, then narrow it.
    *   **Escape Hatch**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (Use sparingly, e.g., for external libraries with bad types).

## 🔄 Workflow for "GitHub Upload Failed"

1.  **Read Logs**: Get the specific error from the "Annotations" or "Build" step.
2.  **Isolate**: Identify the file and line number.
3.  **Diagnose**: Is it a Type Error? Casing Error? Duplicate Key? Linter Error?
4.  **Fix**: Apply the relevant pattern above.
5.  **Verify**: Run `pnpm build` locally.
6.  **Push**: Only push when local build passes.
