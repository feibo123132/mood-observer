export interface MoodRecord {
  id: string;
  timestamp: number;
  score: number; // 0-100
  note: string;
  deletedAt?: number; // timestamp when deleted
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
