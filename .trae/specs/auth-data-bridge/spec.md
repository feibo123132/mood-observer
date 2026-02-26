# Auth Data Bridge Spec

## Why
Users are transitioning from a "soft login" (email-only) system to a secure "passwordless auth" (email + verification code) system.
The existing data in the CloudBase database is keyed by the user's email address (stored in the `userId` field).
The application's data stores (`useMoodStore`, `useSurgeryStore`) currently rely on a specific `localStorage` key (`mood_user_email`) to identify the current user and query the database.
To ensure users can access their existing data without migration, we must bridge the new authentication system with this existing local storage convention.

## What Changes
-   **Modify `src/store/useAuthStore.ts`**:
    -   **Login Sync**: In `auth.onLoginStateChanged`, when a user successfully logs in, automatically write their verified email address to `localStorage.setItem('mood_user_email', user.email)`.
    -   **Logout Sync**: In `logout`, automatically remove this key `localStorage.removeItem('mood_user_email')`.
    -   **Initialization**: In `initAuth`, if a user session is restored, ensure the localStorage key is also synchronized.

## Impact
-   **Affected specs**: Authentication, Data Persistence.
-   **Affected code**: `src/store/useAuthStore.ts`.
-   **User Impact**: Users will see their historical data immediately after logging in with the verified email. No manual data migration is required.

## ADDED Requirements
### Requirement: Email Synchronization
The system SHALL synchronize the authenticated user's email to `localStorage` key `mood_user_email`.

#### Scenario: Login Success
-   **WHEN** the user logs in via verification code
-   **THEN** the system updates `useAuthStore` state
-   **AND** the system writes the email to `localStorage.getItem('mood_user_email')`
-   **AND** `useMoodStore` (and others) can read this key to fetch data.

#### Scenario: Logout
-   **WHEN** the user logs out
-   **THEN** the system removes `mood_user_email` from `localStorage`.
