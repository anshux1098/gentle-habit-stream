import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target, Calendar, Trophy } from 'lucide-react';
import { WeeklySummaryShare } from '@/components/WeeklySummaryShare';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { MonthlySummaryCard } from '@/components/MonthlySummaryCard';
import { useHabits } from '@/contexts/HabitContext';
import { useInsights } from '@/hooks/useInsights';
import { ACHIEVEMENTS } from '@/types/habit';
import { getCurrentMonth, getPreviousMonth, getWeekStart, getEffectiveDate, getLastNDays, getMonthName, isHabitScheduledForDate } from '@/lib/dateUtils';

export default function AnalyticsPage() {
  const {
    habits,
    completions,
    settings,
    getDailyCompletionPercentage,
    getWeeklyAverage,
    getPerfectDaysCount,
    getHighestStreak,
    getCompletionTrend,
    getBestPerformanceDays,
    calculateStreak,
    getWeeklyGoalProgress,
    getHabitsForDate,
    unlockedAchievements,
    saveMonthlySummary,
    getMonthlySummaries,
    getInsightOutcomes,
    getDailyReflections,
    getHabitEditHistory,
    getCurrentWeeklyInsight,
  } = useHabits();

  const {
    generateMonthlySummary,
    generateMonthlyInsight,
    isLoadingMonthly,
  } = useInsights(
    habits,
    completions,
    getHabitsForDate,
    calculateStreak,
    getInsightOutcomes(),
    getDailyReflections(),
    getHabitEditHistory()
  );

  // Generate current month summary from existing data, show only with 7+ days of data
  const currentMonthlySummary = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const savedSummaries = getMonthlySummaries();
    const existing = savedSummaries.find(s => s.month === currentMonth);
    if (existing) return existing;
    
    const generated = generateMonthlySummary(currentMonth);
    // Only show if we have meaningful data (7+ days tracked)
    if (!generated || generated.habitConsistency.length === 0) return null;
    const totalScheduledDays = generated.perfectDays + Math.round(
      (generated.averageCompletion > 0 ? 1 : 0) * 30
    );
    // Simple check: need at least some data points
    if (generated.averageCompletion === 0 && generated.perfectDays === 0) return null;
    return generated;
  }, [getMonthlySummaries, generateMonthlySummary]);

  const handleGenerateMonthlyInsight = async () => {
    if (!currentMonthlySummary) return;
    const insights = await generateMonthlyInsight();
    if (insights && currentMonthlySummary) {
      saveMonthlySummary({ ...currentMonthlySummary, aiInsights: insights });
    }
  };

  const todayCompletion = getDailyCompletionPercentage();
  const weeklyAverage = getWeeklyAverage();
  const perfectDays = getPerfectDaysCount();
  const highestStreak = getHighestStreak();
  const completionTrend = getCompletionTrend();
  const bestDays = getBestPerformanceDays();

  const activeHabits = habits.filter(h => h.active);

  // Compute weekly share data
  const weeklyShareData = useMemo(() => {
    const today = getEffectiveDate();
    const weekStart = getWeekStart(today);
    const last7 = getLastNDays(7);

    // Week range display
    const wsDate = new Date(weekStart);
    const weDate = new Date(wsDate);
    weDate.setDate(weDate.getDate() + 6);
    const startLabel = `${getMonthName(weekStart, true)} ${wsDate.getDate()}`;
    const endLabel = weDate.getMonth() !== wsDate.getMonth()
      ? `${getMonthName(`${weDate.getFullYear()}-${String(weDate.getMonth() + 1).padStart(2, '0')}-${String(weDate.getDate()).padStart(2, '0')}`, true)} ${weDate.getDate()}`
      : String(weDate.getDate());
    const weekRange = `${startLabel} – ${endLabel}`;

    // Perfect days this week
    let perfect = 0;
    for (const d of last7) {
      const scheduled = habits.filter(h => h.active && !h.pausedAt && isHabitScheduledForDate(h.type, d));
      if (scheduled.length === 0) continue;
      const allDone = scheduled.every(h => completions.some(c => c.habitId === h.id && c.date === d && c.completed));
      if (allDone) perfect++;
    }

    // Focus rate: use weekly average as a privacy-safe proxy
    const focusRate = weeklyAverage;

    // AI insight summary (from current weekly insight if available)
    const currentInsight = getCurrentWeeklyInsight?.();
    const insightSummary = currentInsight?.focusSuggestion;

    return {
      weekRange,
      completionPercentage: weeklyAverage,
      perfectDays: perfect,
      focusHabitRate: focusRate,
      insightSummary,
    };
  }, [habits, completions, weeklyAverage, getCurrentWeeklyInsight]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            {activeHabits.length > 0 && (
              <WeeklySummaryShare data={weeklyShareData} />
            )}
          </div>
          <p className="text-muted-foreground">Track your progress over time</p>
        </motion.header>

        {/* Monthly Summary */}
        {currentMonthlySummary && (
          <MonthlySummaryCard
            summary={currentMonthlySummary}
            isGeneratingInsight={isLoadingMonthly}
            onGenerateInsight={handleGenerateMonthlyInsight}
          />
        )}

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard
            label="Today"
            value={`${todayCompletion.toFixed(settings.percentagePrecision)}%`}
            icon={Target}
            variant="success"
          />
          <StatCard
            label="Highest Streak"
            value={highestStreak}
            icon={Flame}
            variant="streak"
          />
          <StatCard
            label="Weekly Avg"
            value={`${weeklyAverage.toFixed(settings.percentagePrecision)}%`}
            icon={TrendingUp}
            variant="default"
          />
          <StatCard
            label="Perfect Days"
            value={perfectDays}
            icon={Calendar}
            variant="focus"
          />
        </motion.div>

        {/* Weekly Heatmap */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <WeeklyHeatmap getCompletionPercentage={getDailyCompletionPercentage} />
        </motion.section>

        {/* Best Performance Days */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-card border border-border space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Best Performance Days</h3>
          <div className="flex gap-2">
            {bestDays.map((day, index) => (
              <div 
                key={day.day}
                className="flex-1 text-center"
              >
                <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(day.average, 4)}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="mx-auto w-6 rounded-t-sm bg-success/60 min-h-[4px]"
                  style={{ height: `${Math.max(day.average * 0.6, 4)}px` }}
                />
                <div className="text-xs font-medium mt-1">
                  {day.average > 0 ? `${day.average.toFixed(0)}%` : '-'}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Completion Trend (Last 30 Days) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-card border border-border space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Last 30 Days</h3>
          <div className="flex items-end gap-0.5 h-20">
            {completionTrend.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(day.percentage, 2)}%` }}
                transition={{ delay: index * 0.01, duration: 0.3 }}
                className="flex-1 rounded-t-sm bg-success/50 min-h-[2px]"
                title={`${day.date}: ${day.percentage.toFixed(0)}%`}
              />
            ))}
          </div>
        </motion.section>

        {/* Habit Streaks */}
        {activeHabits.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-card border border-border space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Current Streaks</h3>
            <div className="space-y-2">
              {activeHabits.map(habit => {
                const streak = calculateStreak(habit.id);
                const isGoal = habit.streakMode === 'goal';
                const goalProgress = isGoal ? getWeeklyGoalProgress(habit.id) : null;
                return (
                  <div key={habit.id} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground truncate block">
                        {habit.name}
                      </span>
                      {isGoal && goalProgress && (
                        <span className="text-xs text-muted-foreground">
                          {goalProgress.completed}/{goalProgress.target} this week
                          {goalProgress.completed >= goalProgress.target && ' ✓'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {streak > 0 && <span className="text-sm streak-flame">🔥</span>}
                      <span className={`text-sm font-medium ${streak > 0 ? 'text-streak' : 'text-muted-foreground'}`}>
                        {streak} {isGoal ? (streak === 1 ? 'week' : 'weeks') : (streak === 1 ? 'day' : 'days')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-xl bg-card border border-border space-y-3"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-medium text-muted-foreground">Achievements</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map(achievement => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <div 
                  key={achievement.id}
                  className={`p-3 rounded-lg border ${
                    isUnlocked 
                      ? 'bg-warning-muted border-warning/20' 
                      : 'bg-muted/30 border-border opacity-50'
                  }`}
                >
                  <div className="text-sm font-medium">{achievement.name}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Empty State */}
        {activeHabits.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              Add some habits to start tracking your progress!
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
