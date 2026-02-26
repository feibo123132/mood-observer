# Menu Structure Reorganization Spec

## Why
The user wants to reorganize the main menu (UserMenu) to introduce a new "Others" ("其他") section. This section will house less frequently accessed features, specifically moving the newly created "Data Migration" ("找回旧数据") feature from the HomePage into this menu, alongside other secondary items. This improves UI cleanliness and logical grouping.

## What Changes
-   **Modify `src/components/UserMenu.tsx`**:
    -   Introduce a collapsible "Others" ("其他") menu item.
    -   Move "Data Migration" trigger into this "Others" submenu.
    -   (Optional) Re-evaluate other items for this group, but strictly speaking only "Data Migration" is requested.
-   **Modify `src/pages/HomePage.tsx`**:
    -   Remove the "Data Migration" button from the main content area.
    -   Remove the `isMigrationOpen` state and `DataMigrationModal` from HomePage.
    -   **CRITICAL**: The `DataMigrationModal` needs to be accessible from `UserMenu`.
        -   Option A: Lift state up to a common ancestor (e.g., Layout or App).
        -   Option B: Include `DataMigrationModal` directly inside `UserMenu`. **(Selected for simplicity)**.

## Impact
-   **Affected specs**: UI/UX.
-   **Affected code**: `UserMenu.tsx`, `HomePage.tsx`.

## ADDED Requirements
### Requirement: "Others" Menu Group
The UserMenu SHALL contain a collapsible section labeled "其他" (Others).

### Requirement: Data Migration in Menu
The "Data Migration" feature SHALL be accessible ONLY via the "Others" menu group.

## REMOVED Requirements
### Requirement: Data Migration on HomePage
The "Data Migration" button SHALL be removed from the HomePage's main view.
