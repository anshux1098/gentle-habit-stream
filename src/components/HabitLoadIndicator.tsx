import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, Pause, ArrowDownRight, Target, HelpCircle } from 'lucide-react';
import type { HabitLoadLevel, HabitLoadExplanation } from '@/types/habit';

interface HabitLoadIndicatorProps {
  level: HabitLoadLevel;
  habitCount: number;
  completionRate: number;
  explanation?: HabitLoadExplanation;
}

const levelConfig: Record<HabitLoadLevel, { label: string; color: string; bgColor: string; icon: string }> = {
  light: {
    label: 'Light',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: '🌱',
  },
  balanced: {
    label: 'Balanced',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: '⚖️',
  },
  heavy: {
    label: 'Heavy',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '⚡',
  },
};

const suggestionIcons = {
  pause: Pause,
  reduce_frequency: ArrowDownRight,
  lower_goals: Target,
};

export function HabitLoadIndicator({ 
  level, 
  habitCount, 
  completionRate, 
  explanation 
}: HabitLoadIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = levelConfig[level];
  const hasExplanation = level === 'heavy' && explanation;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg ${config.bgColor} overflow-hidden`}
    >
      <button
        onClick={() => hasExplanation && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 ${hasExplanation ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!hasExplanation}
      >
        <Activity className={`w-4 h-4 ${config.color}`} />
        <div className="flex flex-col flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${config.color}`}>
              {config.icon} {config.label} Load
            </span>
            {hasExplanation && (
              <HelpCircle className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {habitCount} habit{habitCount !== 1 ? 's' : ''} · {completionRate.toFixed(0)}% avg
          </span>
        </div>
        {hasExplanation && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && explanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Why section */}
              <div className="p-2.5 rounded-lg bg-background/50 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3" />
                  Why am I seeing this?
                </h4>
                <p className="text-sm text-foreground/90">
                  {explanation.message}
                </p>
              </div>

              {/* Suggestion */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                {(() => {
                  const SuggestionIcon = suggestionIcons[explanation.suggestion];
                  return <SuggestionIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />;
                })()}
                <span>
                  {explanation.suggestion === 'pause' && 'Consider pausing 1-2 habits temporarily'}
                  {explanation.suggestion === 'reduce_frequency' && 'Try converting daily habits to weekday-only'}
                  {explanation.suggestion === 'lower_goals' && 'Focus on your 2-3 most important habits'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground/70 text-center pt-1 border-t border-border/50">
                This is just a suggestion — you decide what works best
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Calculate habit load level based on habit count and completion rate
 */
export function calculateHabitLoad(habitCount: number, completionRate: number): HabitLoadLevel {
  if (habitCount === 0) return 'light';
  
  if (habitCount >= 7 || (habitCount > 0 && completionRate < 50)) {
    return 'heavy';
  }
  
  if (habitCount <= 3 || completionRate >= 80) {
    return 'light';
  }
  
  return 'balanced';
}
