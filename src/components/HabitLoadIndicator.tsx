import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { HabitLoadLevel } from '@/types/habit';

interface HabitLoadIndicatorProps {
  level: HabitLoadLevel;
  habitCount: number;
  completionRate: number;
}

const levelConfig: Record<HabitLoadLevel, { label: string; color: string; bgColor: string }> = {
  light: {
    label: 'Light',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  balanced: {
    label: 'Balanced',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  heavy: {
    label: 'Heavy',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
};

export function HabitLoadIndicator({ level, habitCount, completionRate }: HabitLoadIndicatorProps) {
  const config = levelConfig[level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}
    >
      <Activity className={`w-4 h-4 ${config.color}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label} Load
        </span>
        <span className="text-xs text-muted-foreground">
          {habitCount} habits · {completionRate.toFixed(0)}% avg
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Calculate habit load level based on habit count and completion rate
 */
export function calculateHabitLoad(habitCount: number, completionRate: number): HabitLoadLevel {
  // Light: 1-3 habits OR completion rate >= 80%
  // Balanced: 4-6 habits AND completion rate 50-80%
  // Heavy: 7+ habits OR completion rate < 50%
  
  if (habitCount === 0) return 'light';
  
  if (habitCount >= 7 || (habitCount > 0 && completionRate < 50)) {
    return 'heavy';
  }
  
  if (habitCount <= 3 || completionRate >= 80) {
    return 'light';
  }
  
  return 'balanced';
}
