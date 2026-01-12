import { useMemo } from 'react';
import { useMoodStore } from '../store/useMoodStore';
import { getMoodState } from '../utils/moodUtils';
import { subDays, isAfter, startOfDay, isWithinInterval } from 'date-fns';

export type SortType = 'time' | 'score_desc' | 'score_asc';

interface UseMoodStatsProps {
  sortBy?: SortType;
  dateRange?: { start: Date; end: Date } | null;
}

export const useMoodStats = ({ sortBy = 'time', dateRange = null }: UseMoodStatsProps = {}) => {
  const { records } = useMoodStore();

  const activeRecords = useMemo(() => records.filter(r => !r.deletedAt), [records]);

  // 1. 统计情绪分布 (Mood Distribution)
  const moodDistribution = useMemo(() => {
    // 初始化 11 个档位的计数器
    // 为了保持顺序，我们预定义好所有可能的状态标签
    // 这里我们动态计算，但更好的方式是基于 moodUtils 的定义
    const dist: Record<string, { count: number; color: string; label: string }> = {};
    
    // Filter by date range if provided, otherwise use all
    const filteredForDist = dateRange 
      ? activeRecords.filter(r => isWithinInterval(new Date(r.timestamp), dateRange))
      : activeRecords;

    filteredForDist.forEach(record => {
      const { label, color } = getMoodState(record.score);
      if (!dist[label]) {
        dist[label] = { count: 0, color, label };
      }
      dist[label].count += 1;
    });

    // 转换为数组并按特定逻辑排序（这里简单按数量降序，或者您可以改为按情绪分数高低排序）
    return Object.values(dist).sort((a, b) => b.count - a.count);
  }, [activeRecords, dateRange]);

  // 2. 周回顾数据 (Weekly Records) -> Now supports custom range
  const weeklyRecords = useMemo(() => {
    // 确保 records 是数组
    if (!Array.isArray(activeRecords)) return [];

    let filtered = [];
    
    if (dateRange) {
      filtered = activeRecords.filter(r => isWithinInterval(new Date(r.timestamp), dateRange));
    } else {
      // Default: Last 7 days
      const oneWeekAgo = startOfDay(subDays(new Date(), 7));
      filtered = activeRecords.filter(r => {
        if (!r.timestamp) return false;
        return isAfter(new Date(r.timestamp), oneWeekAgo);
      });
    }

    // 排序逻辑 (确保创建新副本进行排序)
    return [...filtered].sort((a, b) => {
      const timeA = Number(a.timestamp);
      const timeB = Number(b.timestamp);
      const scoreA = Number(a.score);
      const scoreB = Number(b.score);

      if (sortBy === 'time') {
        // 时间倒序：新的在前
        return timeB - timeA;
      }
      if (sortBy === 'score_desc') {
        // 分数高到低。如果分数相同，按时间倒序
        if (scoreB !== scoreA) return scoreB - scoreA;
        return timeB - timeA;
      }
      if (sortBy === 'score_asc') {
        // 分数低到高。如果分数相同，按时间倒序
        if (scoreA !== scoreB) return scoreA - scoreB;
        return timeB - timeA;
      }
      return 0;
    });
  }, [activeRecords, sortBy, dateRange]);

  return {
    moodDistribution,
    weeklyRecords
  };
};
