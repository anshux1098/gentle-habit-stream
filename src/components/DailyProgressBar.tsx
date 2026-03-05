import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';
import { getEffectiveDate, isHabitScheduledForDate } from '@/lib/dateUtils';

export function DailyProgressBar() {
  const { habits, completions } = useHabits();
  const today = getEffectiveDate();

  const { completed, total } = useMemo(() => {
    const scheduled = habits.filter(h => h.active && !h.pausedAt && isHabitScheduledForDate(h.type, today));
    const done = scheduled.filter(h =>
      completions.some(c => c.habitId === h.id && c.date === today && c.completed)
    );
    return { completed: done.length, total: scheduled.length };
  }, [habits, completions, today]);

  if (total === 0) return null;

  const percentage = (completed / total) * 100;
  const allDone = completed === total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4" />
          <span>Daily Progress</span>
        </div>
        <span className={`font-semibold ${allDone ? 'text-success' : 'text-foreground'}`}>
          {completed} / {total}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-success"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
