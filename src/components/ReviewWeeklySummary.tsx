import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';
import { getLastNDays, isHabitScheduledForDate, getEffectiveDate } from '@/lib/dateUtils';

export function ReviewWeeklySummary() {
  const { habits, completions } = useHabits();

  const summary = useMemo(() => {
    const last7 = getLastNDays(7);
    const activeHabits = habits.filter(h => h.active && !h.pausedAt);

    if (activeHabits.length === 0) return null;

    let totalScheduled = 0;
    let totalCompleted = 0;

    const habitScores: { name: string; completed: number; scheduled: number; rate: number }[] = [];

    for (const habit of activeHabits) {
      let scheduled = 0;
      let completed = 0;
      for (const date of last7) {
        if (isHabitScheduledForDate(habit.type, date)) {
          scheduled++;
          if (completions.some(c => c.habitId === habit.id && c.date === date && c.completed)) {
            completed++;
          }
        }
      }
      totalScheduled += scheduled;
      totalCompleted += completed;
      if (scheduled > 0) {
        habitScores.push({ name: habit.name, completed, scheduled, rate: Math.round((completed / scheduled) * 100) });
      }
    }

    if (habitScores.length === 0) return null;

    const sorted = [...habitScores].sort((a, b) => b.rate - a.rate);
    const best = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const consistency = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    return { totalCompleted, totalScheduled, consistency, best, weakest };
  }, [habits, completions]);

  if (!summary) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border text-center">
        <p className="text-sm text-muted-foreground">Add habits and track them for a week to see your summary.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border space-y-4"
    >
      <h3 className="text-sm font-semibold text-foreground">Weekly Summary</h3>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-lg font-bold text-foreground">{summary.totalCompleted}/{summary.totalScheduled}</div>
          <div className="text-xs text-muted-foreground">Habits Completed</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className={`text-lg font-bold ${summary.consistency >= 70 ? 'text-success' : summary.consistency >= 40 ? 'text-warning' : 'text-destructive'}`}>
            {summary.consistency}%
          </div>
          <div className="text-xs text-muted-foreground">Consistency</div>
        </div>
      </div>

      {/* Best & Weakest */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success-muted/50">
          <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">Best Habit</span>
            <p className="text-sm font-medium text-foreground truncate">{summary.best.name}</p>
          </div>
          <span className="text-sm font-semibold text-success">{summary.best.rate}%</span>
        </div>

        {summary.best.name !== summary.weakest.name && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5">
            <TrendingDown className="w-4 h-4 text-destructive/70 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">Needs Work</span>
              <p className="text-sm font-medium text-foreground truncate">{summary.weakest.name}</p>
            </div>
            <span className="text-sm font-semibold text-destructive/70">{summary.weakest.rate}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
