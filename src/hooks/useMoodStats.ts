import { useMemo } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { getMoodState } from '../utils/moodUtils';
import { getHarvestLevel } from '../utils/harvestUtils';
import { MoodRecord } from '../types'; // Import MoodRecord type

export type SortType = 'time' | 'score_desc' | 'score_asc';

interface UseMoodStatsProps {
  sortBy: SortType;
  dateRange: { start: Date; end: Date } | null;
}

export const useMoodStats = ({ sortBy, dateRange }: UseMoodStatsProps) => {
  const { records } = useMoodStore();

  // 0. Filter records by date range first
  const activeRecords = useMemo(() => {
    if (!dateRange) return records;
    return records.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= dateRange.start.getTime() && t <= dateRange.end.getTime();
    });
  }, [records, dateRange]);

  // 1. Calculate Distributions (Mood & Harvest)
  const distributions = useMemo(() => {
    const moodDist: Record<string, { count: number; color: string; label: string; records: MoodRecord[] }> = {};
    const harvestDist: Record<string, { count: number; color: string; label: string; records: MoodRecord[] }> = {};
    
    // Priority mappings
    const moodPriority: Record<string, number> = {
      '🤯 巅峰 / 极乐': 100,
      '😍 狂喜 / 热爱': 90,
      '😃 兴奋 / 激动': 80,
      '🙂 开心 / 愉悦': 70,
      '😌 惬意 / 安适': 60,
      '😐 平静 / 归零': 50,
      '🪫 疲惫 / emo': 40,
      '😒 沮丧 / 烦躁': 30,
      '😖 焦虑 / 挣扎': 20,
      '😭 极度痛苦': 10,
      '🥀 绝望 / 崩塌': 0
    };

    const harvestPriority: Record<string, number> = {
      '😍 传说': 100,
      '😃 史诗': 90,
      '🙂 稀有': 80,
      '😌 精良': 70,
      '😐 普通': 60
    };

    activeRecords.forEach(record => {
      const isHarvest = record.type === 'harvest';
      
      if (isHarvest) {
        const { label, color } = getHarvestLevel(record.score);
        if (!harvestDist[label]) {
          harvestDist[label] = { count: 0, color, label, records: [] };
        }
        harvestDist[label].count += 1;
        harvestDist[label].records.push(record);
      } else {
        const { label, color } = getMoodState(record.score);
        if (!moodDist[label]) {
          moodDist[label] = { count: 0, color, label, records: [] };
        }
        moodDist[label].count += 1;
        moodDist[label].records.push(record);
      }
    });

    const sortedMoodDist = Object.values(moodDist).sort((a, b) => {
      const priorityA = moodPriority[a.label] ?? -1;
      const priorityB = moodPriority[b.label] ?? -1;
      return priorityB - priorityA;
    });

    const sortedHarvestDist = Object.values(harvestDist).sort((a, b) => {
      const priorityA = harvestPriority[a.label] ?? -1;
      const priorityB = harvestPriority[b.label] ?? -1;
      return priorityB - priorityA;
    });

    return { mood: sortedMoodDist, harvest: sortedHarvestDist };
  }, [activeRecords]);

  // 2. Weekly Records (Sorted List)
  const weeklyRecords = useMemo(() => {
    return [...activeRecords].sort((a, b) => {
      if (sortBy === 'time') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'score_desc') {
        return b.score - a.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a.score - b.score || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [activeRecords, sortBy]);

  return { 
    moodDistribution: distributions.mood, 
    harvestDistribution: distributions.harvest,
    weeklyRecords 
  };
};
