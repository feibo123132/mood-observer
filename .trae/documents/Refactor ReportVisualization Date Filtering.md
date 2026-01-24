I will refactor the `ReportVisualization.tsx` component to simplify the date filtering logic using `date-fns` as requested.

### The Problem
The current filtering logic in `useMemo` is overly complex and relies on manual parsing and placeholder comments. It tries to filter records by manually extracting week/year numbers, which can be error-prone and hard to maintain.

### The Solution
I will implement the cleaner approach suggested in the image:
1.  **Calculate Week Range**: Use `date-fns` helper functions (`setWeek`, `setYear`, `startOfWeek`, `endOfWeek`) to determine the precise start and end dates of the target week based on the `year` and `week` props.
2.  **Filter with Interval**: Use `isWithinInterval` to check if each record's date falls within that calculated range.

### Implementation Steps
1.  **Modify `src/components/ReportVisualization.tsx`**:
    *   Import necessary `date-fns` functions: `setWeek`, `setYear`, `startOfWeek`, `endOfWeek`, `parseISO`, `isWithinInterval`.
    *   Refactor the `weekData` `useMemo` block.
    *   First, construct a reference date for the target week.
    *   Then, calculate `weekStart` and `weekEnd`.
    *   Finally, filter `records` using `isWithinInterval`.
    *   Remove all old comments and complex parsing logic.

### Technical Detail
To get the correct "reference date" from just a year and week number:
*   We can create a date object for Jan 1st of that `year`.
*   Then use `setWeek(date, week)` to jump to the correct week.
*   Then use `startOfWeek` (with `weekStartsOn: 1` for Monday) to get the boundary.

Let's refine the "reference date" logic. `date-fns` doesn't have a direct `fromWeekYear` helper in the core, but we can do:
```javascript
const referenceDate = new Date(year, 0, 4); // 4th of Jan is always in the first ISO week
const options = { weekStartsOn: 1, firstWeekContainsDate: 4 };
// Actually simpler:
// 1. Get current date or any date in that year
// 2. Set the ISO week
```
Wait, standard `date-fns` doesn't make "construct date from ISO week" trivial without `setISOWeek`.
The user's pseudo-code suggests:
`const someDateInWeek = ... // You need a way to get a date from year/week`

I will use this robust method:
```javascript
import { setISOWeek, setYear, startOfISOWeek, endOfISOWeek } from 'date-fns';
// Construct a date in the target year/week
const dateInTargetWeek = setISOWeek(setYear(new Date(), year), week);
const start = startOfISOWeek(dateInTargetWeek);
const end = endOfISOWeek(dateInTargetWeek);
```
Using ISO week functions is safer because our `week` parameter comes from ISO week calculations (likely).

*Self-Correction*: The previous code used `format(d, 'I')` which is ISO week. So I should stick to ISO week functions.

I will proceed with this plan.