# Fix `useAuthStore.ts` TypeError Plan

## Problem
The user reported a `TypeError: Cannot read properties of undefined (reading 'uid')` at `useAuthStore.ts:40`.
This occurs in the `auth.onLoginStateChanged` callback. The code assumes that if `loginState` is truthy, `loginState.user` exists. However, `loginState.user` is undefined, causing the crash when accessing `.uid`.

## Solution
1.  **Modify `src/store/useAuthStore.ts`**:
    *   Update the `auth.onLoginStateChanged` callback.
    *   Strengthen the condition to check for both `loginState` AND `loginState.user`.
    *   Ensure that if `loginState.user` is missing, we treat it as "not logged in" (clear user from store).

## Implementation Details
```typescript
    // Monitor login state changes
    auth.onLoginStateChanged((loginState) => {
      // Strict check for user existence
      if (loginState && loginState.user) {
        set({
          user: {
            uid: loginState.user.uid,
            email: loginState.user.email,
            isAnonymous: loginState.user.isAnonymous
          },
          isLoading: false
        });
      } else {
        // Clear user if no valid login state or user object
        set({ user: null, isLoading: false });
      }
    });
```

## Verification
1.  Start the development server (`pnpm run dev`).
2.  The error should disappear from the console.
3.  The login page should render correctly without white screen.
