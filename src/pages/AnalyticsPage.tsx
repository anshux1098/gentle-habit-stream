import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target, Calendar, Trophy } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { useHabits } from '@/contexts/HabitContext';
import { ACHIEVEMENTS } from '@/types/habit';

export default function AnalyticsPage() {
  const {
    habits,
    settings,
    getDailyCompletionPercentage,
    getWeeklyAverage,
    getPerfectDaysCount,
    getHighestStreak,
    getCompletionTrend,
    getBestPerformanceDays,
    calculateStreak,
    unlockedAchievements,
  } = useHabits();

  const todayCompletion = getDailyCompletionPercentage();
  const weeklyAverage = getWeeklyAverage();
  const perfectDays = getPerfectDaysCount();
  const highestStreak = getHighestStreak();
  const completionTrend = getCompletionTrend();
  const bestDays = getBestPerformanceDays();

  const activeHabits = habits.filter(h => h.active);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your progress over time</p>
        </motion.header>

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
                return (
                  <div key={habit.id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate flex-1 mr-2">
                      {habit.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {streak > 0 && <span className="text-sm streak-flame">🔥</span>}
                      <span className={`text-sm font-medium ${streak > 0 ? 'text-streak' : 'text-muted-foreground'}`}>
                        {streak} {streak === 1 ? 'day' : 'days'}
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
