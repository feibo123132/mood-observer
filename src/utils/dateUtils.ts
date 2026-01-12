import { startOfYear, endOfYear, eachWeekOfInterval, startOfWeek, endOfWeek, format, isSameYear, getQuarter, startOfQuarter, endOfQuarter } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface WeekInfo {
  id: string; // yyyy-w
  label: string; // 第x周 (MM.dd-MM.dd)
  start: Date;
  end: Date;
  weekNumber: number;
}

export interface QuarterInfo {
  id: number; // 1, 2, 3, 4
  label: string; // 1-3月, 4-6月...
  weeks: WeekInfo[];
}

export const getQuarterWeeks = (year: number): QuarterInfo[] => {
  const quarters: QuarterInfo[] = [
    { id: 1, label: '1-3月', weeks: [] },
    { id: 2, label: '4-6月', weeks: [] },
    { id: 3, label: '7-9月', weeks: [] },
    { id: 4, label: '10-12月', weeks: [] },
  ];

  // Get all weeks in the year
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }); // Monday start

  weeks.forEach((weekStart, index) => {
    // Only include weeks that overlap significantly with the year
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Determine which quarter this week belongs to based on its end date (mostly)
    // A week belongs to the quarter where most of its days fall
    // For simplicity, we use the Thursday of the week to determine the quarter
    const midWeek = new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000);
    const qIndex = getQuarter(midWeek) - 1;

    if (qIndex >= 0 && qIndex < 4) {
      quarters[qIndex].weeks.push({
        id: `${year}-${index + 1}`,
        weekNumber: index + 1,
        label: `第${index + 1}周 (${format(weekStart, 'M.d')}-${format(weekEnd, 'M.d')})`,
        start: weekStart,
        end: weekEnd
      });
    }
  });

  return quarters;
};
