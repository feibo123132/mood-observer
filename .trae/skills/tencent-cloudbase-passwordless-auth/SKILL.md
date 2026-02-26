---
name: "邮箱验证码--tencent-cloudbase-passwordless-auth"
description: "Implements secure email verification code login flow using Tencent CloudBase SDK. Invoke when user needs passwordless authentication or encounters login state errors."
---

# Tencent CloudBase Passwordless Authentication

This skill provides a complete guide for implementing Email Verification Code (Passwordless) Login using Tencent CloudBase (TCB) SDK, including store logic, UI components, and critical safety checks.

## 1. Prerequisites (CloudBase Console)

Before implementation, ensure the following settings are enabled in the Tencent CloudBase Console:
- **Login Authorization**: Enable **Email Login**.
- **Login Authorization**: Enable **Anonymous Login** (recommended for initial connection).
- **Template**: Configure the "Verification Code" email template if necessary.
- **Email Sender**: Ensure you click "Save" to enable the default "CloudBase Email Service" (or configure custom SMTP) in the Email Login settings. Without this, verification codes cannot be sent.

## 2. Store Implementation Pattern (`useAuthStore.ts`)

### Key Principles
1.  **Verification Context**: Store the `verificationInfo` returned by `getVerification`.
2.  **Strict Argument Passing**: Pass `verificationInfo` explicitly to `signInWithEmail`. **DO NOT** use the spread operator (`...context`).
3.  **Safety Checks**: Implement strict null checks for `loginState.user` in `onLoginStateChanged` to prevent crashes.

### Code Snippet

```typescript
import { create } from 'zustand';
import { auth } from '../lib/cloudbase';

interface AuthState {
  user: User | null;
  verificationContext: any | null;
  sendCode: (email: string) => Promise<boolean>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  // ... other actions
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ... state
  
  initAuth: async () => {
    // 1. Monitor Login State (Safety Critical)
    auth.onLoginStateChanged((loginState) => {
      // STRICT CHECK: Ensure both loginState AND loginState.user exist
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
        // Clear user if loginState is invalid or user is missing
        set({ user: null, isLoading: false });
      }
    });

    // 2. Initial Check
    const loginState = await auth.getLoginState();
    if (!loginState || !loginState.user) {
       set({ isLoading: false });
    }
  },

  sendCode: async (email: string) => {
    try {
      // Get verification context
      const response = await auth.getVerification({ email });
      if (response) {
         set({ verificationContext: response }); // Store context
         return true;
      }
      return false;
    } catch (err) {
      console.error('Send code failed:', err);
      return false;
    }
  },

  loginWithCode: async (email: string, code: string) => {
    const context = get().verificationContext;
    if (!context) throw new Error('Context missing');

    try {
      // CRITICAL: Explicitly pass verificationInfo
      await auth.signInWithEmail({
        email: email,
        verificationCode: code,
        verificationInfo: context // DO NOT SPREAD THIS OBJECT
      });
      // Success handled by onLoginStateChanged
      set({ verificationContext: null });
    } catch (err) {
      throw err;
    }
  }
}));
```

## 3. UI Implementation Pattern (`LoginPage.tsx`)

### Key Features
1.  **Countdown Timer**: Prevent spamming verification codes (60s).
2.  **Memory Leak Prevention**: Clear timer interval on unmount.
3.  **Flow**: Email Input -> Send Code -> Show Code Input -> Login.

### Code Snippet

```typescript
// Countdown Logic with Cleanup
useEffect(() => {
  if (countdown > 0) {
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer); // Critical for memory safety
  }
}, [countdown]);

// Render Logic
{codeSent ? (
  // Show Verification Code Input & Login Button
) : (
  // Show Email Input & Send Button
)}
```

## 4. Troubleshooting

-   **"Identity Source Not Enabled"**: Check CloudBase Console settings.
-   **"Cannot read properties of undefined (reading 'uid')"**: Ensure `initAuth` has strict null checks for `loginState.user`.
-   **"Invalid verification code"**: Ensure `verificationInfo` is passed correctly and context hasn't expired.
