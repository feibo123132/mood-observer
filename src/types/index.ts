export interface MoodRecord {
  id: string;
  timestamp: number;
  score: number; // 0-100. For harvest: 0, 25, 50, 75, 100
  note: string;
  type?: 'mood' | 'harvest';
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  averageScore: number;
  records: MoodRecord[];
}

export type MoodCategory = 'despair' | 'anxiety' | 'peace' | 'happiness' | 'ecstasy';

export interface MoodTheme {
  label: string;
  color: string;
  bgGradient: string;
}
