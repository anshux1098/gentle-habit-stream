import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { HabitList } from '@/components/HabitList';
import { AddHabitForm } from '@/components/AddHabitForm';
import { ProgressRing } from '@/components/ProgressRing';
import { StatCard } from '@/components/StatCard';
import { MomentumSignalCard } from '@/components/MomentumSignalCard';
import { BurnoutIndicatorCard } from '@/components/BurnoutIndicatorCard';
import { ReflectionInput, type ReflectionContext } from '@/components/ReflectionInput';
import { useHabits } from '@/contexts/HabitContext';
import { useInsights } from '@/hooks/useInsights';
import { getEffectiveDate, getDayName, getMonthName, isWeekend, isAfter8PM, getTomorrow } from '@/lib/dateUtils';
import type { ReflectionMood, ReflectionReason } from '@/types/habit';

const LAST_SIGNAL_KEY = 'habit-flow-last-signal';

/**
 * Prevents showing the exact same intelligence message on consecutive days.
 * Returns null if the message was already shown yesterday (or today earlier).
 * Stores the current message for future dedup.
 */
function deduplicateSignalMessage(message: string, today: string): boolean {
  try {
    const stored = localStorage.getItem(LAST_SIGNAL_KEY);
    if (stored) {
      const { message: lastMsg, date: lastDate } = JSON.parse(stored);
      // If same message was shown yesterday or today, suppress it
      if (lastMsg === message && lastDate !== today) {
        // Same message on a different (recent) day — vary or suppress
        // We suppress: the caller should try alternate signals
        return false;
      }
    }
    localStorage.setItem(LAST_SIGNAL_KEY, JSON.stringify({ message, date: today }));
    return true;
  } catch {
    return true;
  }
}

export default function TodayPage() {
  const { 
    habits,
    completions,
    getHabitsForDate, 
    getDailyCompletionPercentage,
    getWeeklyAverage,
    getHighestStreak,
    calculateStreak,
    getInsightOutcomes,
    getDailyReflections,
    getHabitEditHistory,
    saveDailyReflection,
    settings
  } = useHabits();

  const today = getEffectiveDate();
  const todayHabits = getHabitsForDate(today);
  const dailyReflections = getDailyReflections();
  
  // Check if user has completed at least one habit today
  const completedHabitsToday = useMemo(() => {
    return todayHabits.filter(h => {
      const completion = completions.find(c => c.habitId === h.id && c.date === today);
      return completion?.completed === true;
    });
  }, [todayHabits, completions, today]);

  // Get today's reflection if it exists
  const todaysReflection = useMemo(() => {
    return dailyReflections.find(r => r.date === today);
  }, [dailyReflections, today]);

  // Get momentum and burnout signals from insights hook
  const { generateMomentumSignals, detectBurnoutSignals } = useInsights(
    habits,
    completions,
    getHabitsForDate,
    calculateStreak,
    getInsightOutcomes(),
    dailyReflections,
    getHabitEditHistory()
  );

  // Detect burnout signals — pick the highest severity one
  const topBurnoutSignal = useMemo(() => {
    const signals = detectBurnoutSignals();
    if (signals.length === 0) return null;
    const severityOrder = { concerning: 3, moderate: 2, mild: 1 };
    const sorted = [...signals].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    const top = sorted[0];
    // Deduplicate: don't show same message on consecutive days
    if (!deduplicateSignalMessage(top.message, today)) {
      // Try next signal
      for (const s of sorted.slice(1)) {
        if (deduplicateSignalMessage(s.message, today)) return s;
      }
      return null;
    }
    return top;
  }, [detectBurnoutSignals, today]);

  // Get momentum signal — only if NO burnout signal is active (mutual exclusion)
  const todaysMomentumSignal = useMemo(() => {
    if (topBurnoutSignal) return null; // Burnout takes priority — never show both
    
    const signals = generateMomentumSignals();
    if (signals.length === 0) return null;
    
    // Priority: identity_shift > consistency > recovery
    const priorityOrder = ['identity_shift', 'consistency', 'recovery'] as const;
    for (const type of priorityOrder) {
      const signal = signals.find(s => s.type === type);
      if (signal && deduplicateSignalMessage(signal.message, today)) {
        return signal;
      }
    }
    // All were deduplicated — show nothing rather than repeat
    return null;
  }, [generateMomentumSignals, topBurnoutSignal, today]);

  // Determine reflection context based on active signal
  const reflectionContext: ReflectionContext = useMemo(() => {
    if (topBurnoutSignal) return 'burnout';
    if (todaysMomentumSignal) return 'momentum';
    return 'neutral';
  }, [topBurnoutSignal, todaysMomentumSignal]);

  // Handle reflection submission
  const handleReflectionSubmit = (mood: ReflectionMood, reasons: ReflectionReason[]) => {
    saveDailyReflection(today, mood, reasons);
  };

  const isWeekendDay = isWeekend(today);
  const completionPercentage = getDailyCompletionPercentage(today);
  const weeklyAverage = getWeeklyAverage();
  const highestStreak = getHighestStreak();
  const showTomorrowPreview = isAfter8PM();

  // Parse date for display
  const [year, month, day] = today.split('-');
  const dayNum = parseInt(day);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl font-bold text-foreground">
            {isWeekendDay ? 'Weekend Focus' : "Today's Habits"}
          </h1>
          <p className="text-muted-foreground">
            {getDayName(today)}, {getMonthName(today, true)} {dayNum}
          </p>
        </motion.header>

        {/* Progress Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center py-6"
        >
          <ProgressRing 
            percentage={completionPercentage} 
            size={140}
            strokeWidth={10}
            precision={settings.percentagePrecision}
          />
        </motion.section>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard
            label="Weekly Avg"
            value={`${weeklyAverage.toFixed(settings.percentagePrecision)}%`}
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            label="Best Streak"
            value={highestStreak}
            icon={Sparkles}
            variant="streak"
          />
        </motion.div>

        {/* Habit List */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isWeekendDay ? 'Weekend Habits' : 'Habits'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {todayHabits.length} habits
            </span>
          </div>
          
          <HabitList 
            habits={todayHabits} 
            date={today}
            emptyMessage={isWeekendDay 
              ? "No weekend habits yet. Add some below!" 
              : "No habits for today. Start by adding one below!"
            }
          />
          
          <AddHabitForm />
        </motion.section>

        {/* Intelligence Card — at most ONE: Burnout OR Momentum, never both */}
        {topBurnoutSignal && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <BurnoutIndicatorCard indicator={topBurnoutSignal} />
          </motion.section>
        )}

        {todaysMomentumSignal && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <MomentumSignalCard signal={todaysMomentumSignal} />
          </motion.section>
        )}

        {/* Daily Reflection — optional, only after completing at least one habit */}
        {completedHabitsToday.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ReflectionInput
              onSubmit={handleReflectionSubmit}
              currentMood={todaysReflection?.mood}
              currentReasons={todaysReflection?.reasons}
              context={reflectionContext}
            />
          </motion.section>
        )}

        {/* Tomorrow Preview (after 8 PM) */}
        {showTomorrowPreview && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="p-4 rounded-xl bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Tomorrow Preview</h3>
            </div>
            <TomorrowPreview />
          </motion.section>
        )}

        {/* Weekend encouragement */}
        {isWeekend(today) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-4 text-sm text-muted-foreground"
          >
            <p>🌿 Consistency {'>'} perfection. Small steps count.</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

function TomorrowPreview() {
  const { getHabitsForDate } = useHabits();
  const tomorrow = getTomorrow();
  const tomorrowHabits = getHabitsForDate(tomorrow);
  const isWeekendDay = isWeekend(tomorrow);

  if (tomorrowHabits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No habits scheduled for tomorrow.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">
        {tomorrowHabits.length} {isWeekendDay ? 'weekend' : 'weekday'} habit{tomorrowHabits.length !== 1 ? 's' : ''} tomorrow
      </p>
      <div className="flex flex-wrap gap-2">
        {tomorrowHabits.slice(0, 5).map(habit => (
          <span 
            key={habit.id}
            className="text-xs px-2 py-1 rounded-full bg-background border border-border"
          >
            {habit.name}
          </span>
        ))}
        {tomorrowHabits.length > 5 && (
          <span className="text-xs px-2 py-1 text-muted-foreground">
            +{tomorrowHabits.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}