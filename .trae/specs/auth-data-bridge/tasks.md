# Tasks

- [x] Task 1: Implement Email Synchronization in `useAuthStore.ts`
  - [x] SubTask 1.1: Modify `auth.onLoginStateChanged` to sync verified email to `localStorage.setItem('mood_user_email', user.email)`.
  - [x] SubTask 1.2: Ensure `logout` method removes `localStorage.removeItem('mood_user_email')`.
  - [x] SubTask 1.3: Verify `initAuth` correctly syncs on session restore.
- [x] Task 2: Verify Data Access
  - [x] SubTask 2.1: Test login with an existing email and confirm data appears.
  - [x] SubTask 2.2: Test logout and confirm local data is cleared (or at least the key is removed).
