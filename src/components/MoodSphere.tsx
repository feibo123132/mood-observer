import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { getMoodColor } from '../utils/moodUtils';

interface MoodSphereProps {
  score: number;
  size?: number;
  className?: string;
}

export const MoodSphere = ({ score, size = 300, className = '' }: MoodSphereProps) => {
  const color = useMemo(() => getMoodColor(score), [score]);
  
  // Calculate breathing duration based on score
  const getDuration = (s: number) => {
    if (s <= 20) return 6; // Despair: Very slow
    if (s <= 40) return 1.5; // Anxiety: Fast
    if (s <= 60) return 4;   // Peace: Normal
    if (s <= 80) return 2.5; // Happiness: Lively
    return 1; // Ecstasy: Rapid
  };

  const duration = getDuration(score);

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
       {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl opacity-40"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ background: color }}
      />
      
      {/* Core Sphere */}
      <motion.div
        className="w-full h-full rounded-full relative z-10"
        animate={{
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${color})`,
          boxShadow: `0 0 60px ${color}`,
        }}
      />
    </div>
  );
};
