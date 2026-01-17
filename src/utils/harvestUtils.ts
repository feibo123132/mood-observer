export interface HarvestLevel {
  min: number;
  max: number;
  label: string;
  description: string;
  color: string;
}

export const HARVEST_LEVELS: HarvestLevel[] = [
  {
    min: 0,
    max: 19,
    label: '😐 普通',
    description: '平平淡淡才是真，也是一种收获',
    color: '#9ca3af' // Grey
  },
  {
    min: 20,
    max: 39,
    label: '😌 精良',
    description: '小有成就，继续加油',
    color: '#22c55e' // Green
  },
  {
    min: 40,
    max: 59,
    label: '🙂 稀有',
    description: '难得的际遇，值得铭记',
    color: '#3b82f6' // Blue
  },
  {
    min: 60,
    max: 79,
    label: '😃 史诗',
    description: '升职加薪、考试上岸了！',
    color: '#a855f7' // Purple
  },
  {
    min: 80,
    max: 100,
    label: '😍 传说',
    description: '改变命运的时刻，奇迹发生',
    color: '#eab308' // Gold
  }
];

export const getHarvestLevel = (score: number): HarvestLevel => {
  return HARVEST_LEVELS.find(level => score >= level.min && score <= level.max) || HARVEST_LEVELS[0];
};

// No longer needed to snap score, but keeping for compatibility if referenced elsewhere (though logic changed)
export const snapHarvestScore = (score: number): number => {
  return score;
};
