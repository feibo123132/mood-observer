---
name: "tencent-cloudbase-data-migration"
description: "Implements secure data migration from legacy accounts to new accounts in Tencent CloudBase. Invoke when user needs to merge accounts, retrieve old data, or fix userId mismatches."
---

# Tencent CloudBase Data Migration (Legacy to New Account)

This skill provides a robust pattern for migrating user data from one `userId` (e.g., a legacy/fake email) to another (e.g., a verified email) within Tencent CloudBase (TCB), using a frontend-driven "Read-Rewrite" strategy.

## 1. Core Strategy: Read-Rewrite (Non-Destructive)

Instead of updating the `userId` in place (which might fail due to ACL permissions), we fetch the old data and **re-create** it under the new user's identity.

### Key Principles
1.  **Duplicate Prevention**: Check if the record already exists for the new user before adding.
2.  **Data Cleaning**: Strictly remove system fields (`_id`, `_openid`) before re-writing.
3.  **Audit Trail**: Add `migratedFrom` and `migratedAt` fields for tracking.
4.  **Pagination**: Always use `.limit(1000)` (or loop with skip) when fetching old data to bypass the default 20-item limit.

## 2. Implementation Pattern (`migrateCollection` Function)

```typescript
const migrateCollection = async (collectionName: string, oldUid: string, newUid: string) => {
  // 1. Query Old Data (CRITICAL: Limit 1000)
  const res = await db.collection(collectionName)
    .where({ userId: oldUid })
    .limit(1000) 
    .get();

  if (!res.data || res.data.length === 0) return;

  for (const oldRecord of res.data) {
    try {
      // 2. Duplicate Check (Idempotency)
      // Adapt 'id' field based on your schema (e.g., some use 'id', some use composite keys)
      const exists = await db.collection(collectionName).where({
         userId: newUid,
         id: oldRecord.id 
      }).count();

      if (exists.total > 0) continue; // Skip if already migrated

      // 3. Clean Data (Remove System Fields)
      const { _id, _openid, ...businessData } = oldRecord;
      
      // 4. Write New Data
      await db.collection(collectionName).add({
        ...businessData,
        userId: newUid, // Re-assign owner
        migratedFrom: oldUid, // Audit trail
        migratedAt: new Date().toISOString()
      });

    } catch (e) {
      console.error(`Migrate item failed:`, e);
    }
  }
};
```

## 3. UI/UX Best Practices

-   **Entry Point**: Place the migration tool in a secondary menu (e.g., "Settings" or "Others"), not on the main dashboard.
-   **User Feedback**:
    -   Show a progress indicator (e.g., "Migrating 5/50...").
    -   **Auto Reload**: After successful migration, call `window.location.reload()` to force the app to re-fetch data from the cloud.
-   **Safety**: Do NOT delete the old data. Leave it as a backup.

## 4. Common Pitfalls

-   **Missing Data**: Often caused by forgetting `.limit(1000)` on the query.
-   **Permission Errors**: If database ACL is "Private Read/Write", this frontend migration will fail. Ensure permissions allow "Readable by all" or "Readable by logged-in users" for the migration to work, OR use a Cloud Function for admin-level migration.
-   **Infinite Loops**: Ensure the duplicate check query is correct, otherwise re-running migration will duplicate data.
