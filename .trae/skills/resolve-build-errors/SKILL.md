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

## 🔄 Workflow for "GitHub Upload Failed"

1.  **Read Logs**: Get the specific error from the "Annotations" or "Build" step.
2.  **Isolate**: Identify the file and line number.
3.  **Diagnose**: Is it a Type Error? Casing Error? Duplicate Key?
4.  **Fix**: Apply the relevant pattern above.
5.  **Verify**: Run `pnpm build` locally.
6.  **Push**: Only push when local build passes.
