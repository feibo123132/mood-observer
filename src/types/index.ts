export interface MoodRecord {
  id: string;
  timestamp: number;
  score: number; // 0-100. For harvest: 0, 25, 50, 75, 100
  note: string;
  images?: string[]; // Array of CloudBase FileIDs
  type?: 'mood' | 'harvest';
  date?: string; // ISO date string for compatibility
  deletedAt?: number;
}

export interface SurgeryRecord {
  id: string;
  timestamp: number;
  trouble: string; // The initial automatic thought
  evidence: { support: string; against: string };
  alternative: string;
  implication: string;
  utility: string;
  distancing: string;
  plan: string;
  newThought: string; // The result/conclusion
  deletedAt?: number;
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

export type AudioMode = 'classical' | 'modern' | 'friend';
