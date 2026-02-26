# Authentication System Upgrade Plan (V3 - Passwordless)

## Objective
Implement **Email Verification Code Login (Passwordless)** using Tencent CloudBase (TCB) Auth. This replaces the previous password-based plans.

## Architecture
-   **Backend**: Use `@cloudbase/js-sdk` `auth` module.
-   **Method**: `auth.getVerification` (to send code) + `auth.signInWithEmail` (to login).
-   **Frontend**: React + Zustand.

## Implementation Steps

### 1. Refactor `src/store/useAuthStore.ts`
-   **Remove**: `register`, `login` (password-based), and `hashPassword`.
-   **State**: Add `verificationInfo` (to store the object returned by `getVerification`).
-   **Action `sendCode(email)`**:
    -   Call `auth.getVerification({ email })`.
    -   Store the returned object (which contains necessary context for login) in the store (e.g., as `verificationContext`).
    -   Handle errors (e.g., "Invalid email", "Rate limit").
-   **Action `loginWithCode(email, code)`**:
    -   Retrieve `verificationContext` from store.
    -   **Critical**: Call `auth.signInWithEmail` with explicit `verificationInfo` field (DO NOT use spread operator).
    -   Payload: `{ email, verificationCode: code, verificationInfo: get().verificationContext }`.
    -   Handle errors (e.g., "Invalid code", "Expired").
-   **State Sync**: Keep `initAuth` listening to `onLoginStateChanged`.

### 2. Update `src/pages/LoginPage.tsx`
-   **Simplify UI**:
    -   Remove "Password" and "Confirm Password" fields.
    -   Remove Login/Register toggle.
-   **New Interaction Flow**:
    1.  **Initial State**: Email input + "Send Verification Code" button.
    2.  **Sending State**: Button shows spinner/loading.
    3.  **Sent State**:
        -   "Send Code" button enters 60s countdown (disabled).
        -   Reveal "Verification Code" input field.
        -   Reveal "Login" button.
    4.  **Login State**: User enters code -> Click "Login" -> Success/Fail.
-   **Memory Safety**: Ensure `clearInterval` is called on component unmount to prevent memory leaks during countdown.

## Prerequisites
-   **Console Configuration**: Ensure "Email Login" is enabled in TCB Console and "Send Verification Code" template is configured (if applicable).

## Verification
1.  **Send Code**: Enter valid email, click send. Check if button counts down.
2.  **Receive Code**: Check email inbox for the code.
3.  **Login**: Enter code, click login. Verify successful authentication.
4.  **Error Handling**: Test invalid email, wrong code, and expired code.

