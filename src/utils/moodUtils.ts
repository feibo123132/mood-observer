export interface MoodState {
  label: string;
  description: string;
  color: string;
  emoji: string;
}

export const getMoodState = (score: number): MoodState => {
  if (score >= 96) return {
    label: '🤯 巅峰 / 极乐',
    description: '忘我、天人合一、灵魂升华、极致震撼',
    color: '#eab308', // Gold
    emoji: '🤯'
  };
  if (score >= 90) return {
    label: '😍 狂喜 / 热爱',
    description: '欢呼雀跃、深深的幸福感、想拥抱全世界',
    color: '#a855f7', // Purple
    emoji: '😍'
  };
  if (score >= 80) return {
    label: '😃 兴奋 / 激动',
    description: '心跳加速、充满干劲、热血沸腾、强烈成就感',
    color: '#3b82f6', // Blue
    emoji: '😃'
  };
  if (score >= 70) return {
    label: '🙂 开心 / 愉悦',
    description: '嘴角上扬、有动力、期待、自信、被认可',
    color: '#22c55e', // Green
    emoji: '🙂'
  };
  if (score >= 60) return {
    label: '😌 惬意 / 安适',
    description: '轻松、舒服、小确幸、松弛感',
    color: '#6bffb8', // 清新绿
    emoji: '😌'
  };
  if (score >= 50) return {
    label: '😐 平静 / 归零',
    description: '既不开心也不难过、理智、放空、观察者模式',
    color: '#d1fae5', // 超淡绿
    emoji: '😐'
  };
  if (score >= 40) return {
    label: '🪫 疲惫 / emo',
    description: '提不起劲、无聊、孤独、淡淡忧伤、不想说话',
    color: '#ced4da', // 灰暗
    emoji: '🪫'
  };
  if (score >= 30) return {
    label: '😒 沮丧 / 烦躁',
    description: '俗称的“心情不好”、生气、委屈、抱怨等',
    color: '#868e96', // 深灰
    emoji: '😒'
  };
  if (score >= 20) return {
    label: '😖 焦虑 / 挣扎',
    description: '坐立难安、强烈的担忧、自我怀疑、失眠',
    color: '#495057', // 极深灰
    emoji: '😖'
  };
  if (score >= 10) return {
    label: '😭 极度痛苦',
    description: '痛哭流涕、极度恐惧、心碎、深深的无力感',
    color: '#212529', // 漆黑
    emoji: '😭'
  };
  return {
    label: '🥀 绝望 / 崩塌',
    description: '极度抑郁、毁灭感、无意义、想放弃一切',
    color: '#0e0f0f', // 纯黑
    emoji: '🥀'
  };
};

// Color stops for gradient interpolation
const MOOD_COLORS = [
  { score: 0, color: [14, 15, 15] },    // #0e0f0f (纯黑)
  { score: 10, color: [33, 37, 41] },   // #212529 (漆黑)
  { score: 20, color: [73, 80, 87] },   // #495057 (极深灰)
  { score: 30, color: [134, 142, 150] },// #868e96 (深灰)
  { score: 40, color: [206, 212, 218] },// #ced4da (灰暗)
  { score: 50, color: [209, 250, 229] },// #d1fae5 (超淡绿)
  { score: 60, color: [107, 255, 184] },// #6bffb8 (清新绿)
  { score: 70, color: [34, 197, 94] },  // #22c55e (Green)
  { score: 80, color: [59, 130, 246] }, // #3b82f6 (Blue)
  { score: 90, color: [168, 85, 247] }, // #a855f7 (Purple)
  { score: 100, color: [234, 179, 8] }  // #eab308 (Gold) - Close enough for 100
];

export const getGradientColor = (score: number): string => {
  // Clamp score
  const s = Math.max(0, Math.min(100, score));
  
  // Find lower and upper bounds
  let lower = MOOD_COLORS[0];
  let upper = MOOD_COLORS[MOOD_COLORS.length - 1];

  for (let i = 0; i < MOOD_COLORS.length - 1; i++) {
    if (s >= MOOD_COLORS[i].score && s <= MOOD_COLORS[i+1].score) {
      lower = MOOD_COLORS[i];
      upper = MOOD_COLORS[i+1];
      break;
    }
  }

  if (lower.score === upper.score) {
    return `rgb(${lower.color.join(',')})`;
  }

  // Linear Interpolation
  const t = (s - lower.score) / (upper.score - lower.score);
  const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * t);
  const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * t);
  const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * t);

  return `rgb(${r}, ${g}, ${b})`;
};
