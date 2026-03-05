import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';

export function StreakBanner() {
  const { habits, calculateStreak } = useHabits();

  const topStreak = useMemo(() => {
    const activeHabits = habits.filter(h => h.active && !h.pausedAt);
    if (activeHabits.length === 0) return null;

    let best = { name: '', streak: 0 };
    for (const h of activeHabits) {
      const s = calculateStreak(h.id);
      if (s > best.streak) best = { name: h.name, streak: s };
    }
    return best.streak > 0 ? best : null;
  }, [habits, calculateStreak]);

  if (!topStreak) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-streak-muted border border-streak/20"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-streak/10">
        <Flame className="w-5 h-5 text-streak streak-flame" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-streak">{topStreak.streak}</span>
          <span className="text-sm font-medium text-streak/80">Day Streak</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{topStreak.name}</p>
      </div>
    </motion.div>
  );
}
