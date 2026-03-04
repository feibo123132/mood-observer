export type HealthStatus = 'comfortable' | 'unwell' | 'sick';

export interface HealthState {
  value: HealthStatus;
  label: string;
  description: string;
  color: string;
  score: number;
}

const HEALTH_STATES: HealthState[] = [
  {
    value: 'comfortable',
    label: '舒适',
    description: '身体状态稳定，整体感觉轻松。',
    color: '#10B981',
    score: 85
  },
  {
    value: 'unwell',
    label: '不适',
    description: '有些不舒服，建议适度休息。',
    color: '#F59E0B',
    score: 55
  },
  {
    value: 'sick',
    label: '生病',
    description: '身体明显不舒服，需要优先照顾自己。',
    color: '#EF4444',
    score: 25
  }
];

export const getHealthStates = () => HEALTH_STATES;

export const getHealthStateByValue = (value: HealthStatus): HealthState => {
  return HEALTH_STATES.find((state) => state.value === value) ?? HEALTH_STATES[0];
};

export const getHealthStateByScore = (score: number): HealthState => {
  if (score >= 70) return getHealthStateByValue('comfortable');
  if (score >= 40) return getHealthStateByValue('unwell');
  return getHealthStateByValue('sick');
};
