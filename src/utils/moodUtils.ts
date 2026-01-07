import { MoodCategory } from '../types';

export const getMoodCategory = (score: number): MoodCategory => {
  if (score <= 20) return 'despair';
  if (score <= 40) return 'anxiety';
  if (score <= 60) return 'peace';
  if (score <= 80) return 'happiness';
  return 'ecstasy';
};

export const getMoodLabel = (score: number): string => {
  const category = getMoodCategory(score);
  switch (category) {
    case 'despair': return '绝望 / 痛苦';
    case 'anxiety': return '焦虑 / Emo';
    case 'peace': return '平静 / 归零';
    case 'happiness': return '开心 / 舒适';
    case 'ecstasy': return '狂喜 / 巅峰';
    default: return '平静 / 归零';
  }
};

export const getMoodColor = (score: number): string => {
  // Simple linear interpolation between stops
  const stops = [
    { score: 0, color: [30, 41, 59] }, // slate-800 #1e293b
    { score: 20, color: [51, 65, 85] }, // slate-700 #334155
    { score: 40, color: [99, 102, 241] }, // indigo-500 #6366f1
    { score: 60, color: [20, 184, 166] }, // teal-500 #14b8a6
    { score: 80, color: [250, 204, 21] }, // yellow-400 #facc15
    { score: 100, color: [239, 68, 68] }, // red-500 #ef4444
  ];

  let lower = stops[0];
  let upper = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (score >= stops[i].score && score <= stops[i+1].score) {
      lower = stops[i];
      upper = stops[i+1];
      break;
    }
  }

  if (lower.score === upper.score) return `rgb(${lower.color.join(',')})`;

  const t = (score - lower.score) / (upper.score - lower.score);
  const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * t);
  const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * t);
  const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

export const getMoodGradient = (score: number): string => {
   const color = getMoodColor(score);
   return `radial-gradient(circle at center, ${color}, transparent 70%)`;
};
