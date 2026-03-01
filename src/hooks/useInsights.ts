import { useState, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { toast } from 'sonner';
import type {
  Habit,
  Completion,
  WeeklyInsight,
  MonthlySummary,
  UserProfile,
  HabitLoadLevel,
  HabitLoadExplanation,
  RetirementSuggestion,
  MonthlyInsightItem,
  InsightHistoryEntry,
  InsightFeedback,
  InsightOutcome,
  InsightAdaptation,
  MomentumSignal,
  BurnoutIndicator,
  DailyReflection
} from '@/types/habit';
import {
  getEffectiveDate,
  getWeekStart,
  getLastNDays,
  isWeekend,
  isHabitScheduledForDate,
  getDaysInMonth,
  getDayName,
  daysSince
} from '@/lib/dateUtils';

interface EnhancedHabitInfo {
  id: string;
  name: string;
  type: 'daily' | 'weekday' | 'weekend';
  active: boolean;
  ageInDays: number;
  currentStreak: number;
  completionRate: number;
}

interface InsightData {
  habits: EnhancedHabitInfo[];
  completions: Completion[];
  weekdayCompletionRate: number;
  weekendCompletionRate: number;
  perfectDays: number;
  totalDays: number;
  monthlyAverage: number;
  bestDay: string;
  worstDay: string;
  inactiveHabits: string[];
  // Enhanced context
  userProfile: UserProfile;
  totalHabitCount: number;
  habitsAddedThisMonth: number;
  averageHabitAge: number;
  longestStreak: number;
  dropOffPatterns: Array<{ habitName: string; dropOffDay: number }>;
  hasInsufficientData: boolean;
  daysTracked: number;
  // New: adaptation and reflection context
  insightAdaptation: InsightAdaptation;
  recentReflections: DailyReflection[];
  burnoutSignals: { type: string; count: number }[];
  momentumMetrics: { recoverySpeed: number; consistencyScore: number };
}

export function useInsights(
  habits: Habit[],
  completions: Completion[],
  getHabitsForDate: (date: string) => Habit[],
  calculateStreak: (habitId: string) => number,
  insightOutcomes: { insightId: string; outcome: InsightOutcome }[] = [],
  dailyReflections: DailyReflection[] = [],
  habitEditHistory: { habitId: string; editedAt: string }[] = []
) {
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  /**
   * Calculate completion percentage for a date
   */
  const getDailyCompletion = useCallback((date: string): number => {
    const habitsForDate = habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
    if (habitsForDate.length === 0) return 0;

    const completedCount = habitsForDate.filter(h => {
      const completion = completions.find(c => c.habitId === h.id && c.date === date);
      return completion?.completed === true;
    }).length;

    return (completedCount / habitsForDate.length) * 100;
  }, [habits, completions]);

  /**
   * Determine user profile based on behavior patterns
   */
  const getUserProfile = useCallback((): UserProfile => {
    const activeHabits = habits.filter(h => h.active);
    if (activeHabits.length === 0) return 'beginner';

    const last14Days = getLastNDays(14);
    let totalCompletion = 0;
    let daysWithHabits = 0;

    for (const date of last14Days) {
      const habitsForDate = activeHabits.filter(h => isHabitScheduledForDate(h.type, date));
      if (habitsForDate.length > 0) {
        totalCompletion += getDailyCompletion(date);
        daysWithHabits++;
      }
    }

    const avgCompletion = daysWithHabits > 0 ? totalCompletion / daysWithHabits : 0;
    const oldestHabitAge = Math.max(...activeHabits.map(h => daysSince(h.createdAt.split('T')[0])));

    // Beginner: new habits (< 14 days old) or few habits
    if (oldestHabitAge < 14 || activeHabits.length <= 2) {
      return 'beginner';
    }

    // Struggling: low completion rate
    if (avgCompletion < 50) {
      return 'struggling';
    }

    // Consistent: good completion rate
    return 'consistent';
  }, [habits, completions, getDailyCompletion]);

  /**
   * Detect drop-off patterns (habits that tend to fail after X days)
   */
  const getDropOffPatterns = useCallback((): Array<{ habitName: string; dropOffDay: number }> => {
    const patterns: Array<{ habitName: string; dropOffDay: number }> = [];

    for (const habit of habits.filter(h => h.active)) {
      const last30Days = getLastNDays(30);
      const scheduledDays = last30Days.filter(d => isHabitScheduledForDate(habit.type, d));

      // Look for streaks that break at consistent points
      let streakBreaks: number[] = [];
      let currentStreak = 0;

      for (const date of scheduledDays.reverse()) {
        const completion = completions.find(c => c.habitId === habit.id && c.date === date && c.completed);
        if (completion) {
          currentStreak++;
        } else if (currentStreak > 0 && currentStreak <= 7) {
          streakBreaks.push(currentStreak);
          currentStreak = 0;
        } else {
          currentStreak = 0;
        }
      }

      // If we see a pattern of breaking at day 3-5
      if (streakBreaks.length >= 2) {
        const avgBreak = streakBreaks.reduce((a, b) => a + b, 0) / streakBreaks.length;
        if (avgBreak >= 3 && avgBreak <= 5) {
          patterns.push({ habitName: habit.name, dropOffDay: Math.round(avgBreak) });
        }
      }
    }

    return patterns;
  }, [habits, completions]);

  /**
   * Determine insight adaptation level based on outcome tracking
   */
  const getInsightAdaptation = useCallback((): InsightAdaptation => {
    if (insightOutcomes.length < 3) return 'standard';

    const recentOutcomes = insightOutcomes.slice(-10);
    const ignoredCount = recentOutcomes.filter(o => o.outcome === 'no_change').length;
    const followedCount = recentOutcomes.filter(o => o.outcome === 'habit_paused' || o.outcome === 'frequency_reduced').length;

    // If user ignores recommendations often, simplify
    if (ignoredCount >= 7) return 'simplified';
    // If user follows recommendations, allow more advanced suggestions
    if (followedCount >= 5) return 'advanced';

    return 'standard';
  }, [insightOutcomes]);

  /**
   * Calculate momentum metrics (recovery speed and consistency)
   */
  const getMomentumMetrics = useCallback((): { recoverySpeed: number; consistencyScore: number } => {
    const last14Days = getLastNDays(14);
    let recoveryInstances = 0;
    let totalRecoveryDays = 0;
    let missedDays = 0;
    let totalScheduledDays = 0;
    let completedDays = 0;

    for (const habit of habits.filter(h => h.active)) {
      let inMissedStreak = false;
      let missedStreakLength = 0;

      for (const date of last14Days.reverse()) {
        if (!isHabitScheduledForDate(habit.type, date)) continue;
        totalScheduledDays++;

        const isCompleted = completions.find(c => c.habitId === habit.id && c.date === date && c.completed);

        if (isCompleted) {
          completedDays++;
          if (inMissedStreak && missedStreakLength > 0) {
            recoveryInstances++;
            totalRecoveryDays += missedStreakLength;
          }
          inMissedStreak = false;
          missedStreakLength = 0;
        } else {
          missedDays++;
          inMissedStreak = true;
          missedStreakLength++;
        }
      }
    }

    // Recovery speed: lower is better (average days to recover)
    const recoverySpeed = recoveryInstances > 0 ? totalRecoveryDays / recoveryInstances : 0;
    // Consistency score: percentage of scheduled days completed
    const consistencyScore = totalScheduledDays > 0 ? (completedDays / totalScheduledDays) * 100 : 0;

    return { recoverySpeed, consistencyScore };
  }, [habits, completions]);

  /**
   * Detect burnout signals
   */
  const detectBurnoutSignals = useCallback((): BurnoutIndicator[] => {
    const indicators: BurnoutIndicator[] = [];
    const last14Days = getLastNDays(14);
    const activeHabits = habits.filter(h => h.active);

    // 1. Same-day failures: days where multiple habits were missed
    let sameDayFailures = 0;
    for (const date of last14Days) {
      const habitsForDate = activeHabits.filter(h => isHabitScheduledForDate(h.type, date));
      const completedForDate = habitsForDate.filter(h =>
        completions.find(c => c.habitId === h.id && c.date === date && c.completed)
      );
      const missedCount = habitsForDate.length - completedForDate.length;
      if (missedCount >= 2 && habitsForDate.length >= 2) {
        sameDayFailures++;
      }
    }

    if (sameDayFailures >= 4) {
      indicators.push({
        type: 'same_day_failures',
        severity: sameDayFailures >= 7 ? 'concerning' : 'moderate',
        message: "Some days have been challenging, with multiple habits missed together.",
        suggestion: "Consider identifying what makes those days difficult. Maybe reducing your daily commitment could help.",
        detectedAt: new Date().toISOString()
      });
    }

    // 2. Declining completion: compare first 7 days vs last 7 days
    const first7 = last14Days.slice(0, 7);
    const last7 = last14Days.slice(7);

    const getAvgCompletion = (days: string[]) => {
      let total = 0;
      let count = 0;
      for (const date of days) {
        const completion = getDailyCompletion(date);
        if (completion >= 0) { total += completion; count++; }
      }
      return count > 0 ? total / count : 0;
    };

    const firstWeekAvg = getAvgCompletion(first7);
    const lastWeekAvg = getAvgCompletion(last7);

    if (firstWeekAvg > 60 && lastWeekAvg < firstWeekAvg - 20) {
      indicators.push({
        type: 'declining_completion',
        severity: lastWeekAvg < 40 ? 'concerning' : 'mild',
        message: "Your completion rate has been gradually declining.",
        suggestion: "This might be a sign to step back and simplify. What if you focused on just your most important habit for now?",
        detectedAt: new Date().toISOString()
      });
    }

    // 3. Excessive edits: many habit edits in recent weeks
    const recentEdits = habitEditHistory.filter(e =>
      daysSince(e.editedAt.split('T')[0]) <= 14
    ).length;

    if (recentEdits >= 5) {
      indicators.push({
        type: 'excessive_edits',
        severity: recentEdits >= 8 ? 'moderate' : 'mild',
        message: "You've been adjusting your habits frequently lately.",
        suggestion: "It's okay to experiment, but sometimes stability helps build momentum. Consider keeping your setup stable for a week.",
        detectedAt: new Date().toISOString()
      });
    }

    return indicators;
  }, [habits, completions, habitEditHistory, getDailyCompletion]);

  /**
   * Generate momentum signals
   */
  const generateMomentumSignals = useCallback((): MomentumSignal[] => {
    const signals: MomentumSignal[] = [];
    const { recoverySpeed, consistencyScore } = getMomentumMetrics();
    const activeHabits = habits.filter(h => h.active);

    // Recovery signal
    if (recoverySpeed > 0 && recoverySpeed <= 2) {
      signals.push({
        type: 'recovery',
        message: "You're bouncing back quickly after missed days. That resilience is a key part of long-term success.",
        metric: recoverySpeed,
        generatedAt: new Date().toISOString()
      });
    }

    // Sustained consistency signal (not just streaks)
    if (consistencyScore >= 70) {
      signals.push({
        type: 'consistency',
        message: `You've been consistently showing up — ${consistencyScore.toFixed(0)}% of scheduled days over the past two weeks.`,
        metric: consistencyScore,
        generatedAt: new Date().toISOString()
      });
    }

    // Identity shift for habits with high streaks
    const strongHabits = activeHabits.filter(h => calculateStreak(h.id) >= 14);
    if (strongHabits.length > 0) {
      const habitName = strongHabits[0].name;
      signals.push({
        type: 'identity_shift',
        message: `"${habitName}" has become part of your routine. You're becoming someone who does this regularly.`,
        habitName,
        generatedAt: new Date().toISOString()
      });
    }

    return signals;
  }, [habits, calculateStreak, getMomentumMetrics]);

  /**
   * Get confidence level based on data volume
   */
  const getConfidenceLevel = useCallback((daysTracked: number): 'low' | 'medium' | 'high' => {
    if (daysTracked < 7) return 'low';
    if (daysTracked < 21) return 'medium';
    return 'high';
  }, []);

  /**
   * Get habit load level and explanation
   */
  const getHabitLoadInfo = useCallback((): { level: HabitLoadLevel; explanation?: HabitLoadExplanation } => {
    const activeHabits = habits.filter(h => h.active);
    const habitCount = activeHabits.length;

    if (habitCount === 0) return { level: 'light' };

    const last7Days = getLastNDays(7);
    let totalCompletion = 0;
    let daysWithHabits = 0;

    for (const date of last7Days) {
      const habitsForDate = activeHabits.filter(h => isHabitScheduledForDate(h.type, date));
      if (habitsForDate.length > 0) {
        totalCompletion += getDailyCompletion(date);
        daysWithHabits++;
      }
    }

    const avgCompletion = daysWithHabits > 0 ? totalCompletion / daysWithHabits : 0;

    // Determine level and reason
    const tooManyHabits = habitCount >= 7;
    const lowCompletion = avgCompletion < 50;

    if (tooManyHabits && lowCompletion) {
      return {
        level: 'heavy',
        explanation: {
          reason: 'both',
          suggestion: 'pause',
          message: `You have ${habitCount} habits with ${avgCompletion.toFixed(0)}% completion. Consider pausing 1-2 habits to rebuild momentum.`
        }
      };
    } else if (tooManyHabits) {
      return {
        level: 'heavy',
        explanation: {
          reason: 'too_many_habits',
          suggestion: 'reduce_frequency',
          message: `Managing ${habitCount} habits can be challenging. You might consider converting some daily habits to weekday-only.`
        }
      };
    } else if (lowCompletion && habitCount > 0) {
      return {
        level: 'heavy',
        explanation: {
          reason: 'low_completion',
          suggestion: 'lower_goals',
          message: `Your completion rate is ${avgCompletion.toFixed(0)}%. It might help to temporarily focus on just 2-3 core habits.`
        }
      };
    } else if (habitCount <= 3 || avgCompletion >= 80) {
      return { level: 'light' };
    }

    return { level: 'balanced' };
  }, [habits, completions, getDailyCompletion]);

  /**
   * Prepare enhanced data for AI insight generation
   */
  const prepareInsightData = useCallback((type: 'weekly' | 'monthly'): InsightData => {
    const today = getEffectiveDate();
    const days = type === 'weekly' ? getLastNDays(7) : getLastNDays(30);
    const activeHabits = habits.filter(h => h.active);

    let weekdayTotal = 0;
    let weekdayCount = 0;
    let weekendTotal = 0;
    let weekendCount = 0;
    let perfectDays = 0;

    // Day stats for best/worst performing day
    const dayStats: { [key: string]: number[] } = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => dayStats[d] = []);

    for (const date of days) {
      const habitsForDate = activeHabits.filter(h => isHabitScheduledForDate(h.type, date));
      if (habitsForDate.length === 0) continue;

      const percentage = getDailyCompletion(date);
      const dayName = getDayName(date, true);
      dayStats[dayName].push(percentage);

      if (isWeekend(date)) {
        weekendTotal += percentage;
        weekendCount++;
      } else {
        weekdayTotal += percentage;
        weekdayCount++;
      }

      if (percentage === 100) perfectDays++;
    }

    // Find best and worst days
    const dayAverages = dayNames.map(day => ({
      day,
      avg: dayStats[day].length > 0
        ? dayStats[day].reduce((a, b) => a + b, 0) / dayStats[day].length
        : 0
    }));

    const sortedDays = [...dayAverages].sort((a, b) => b.avg - a.avg);
    const bestDay = sortedDays.find(d => d.avg > 0)?.day || 'N/A';
    const worstDay = sortedDays.reverse().find(d => d.avg > 0)?.day || 'N/A';

    // Enhanced habit info with streaks and age
    const enhancedHabits: EnhancedHabitInfo[] = activeHabits.map(h => {
      const ageInDays = daysSince(h.createdAt.split('T')[0]);
      const currentStreak = calculateStreak(h.id);

      // Calculate completion rate for this habit
      const scheduledDays = days.filter(d => isHabitScheduledForDate(h.type, d));
      const completedDays = scheduledDays.filter(d =>
        completions.find(c => c.habitId === h.id && c.date === d && c.completed)
      );
      const completionRate = scheduledDays.length > 0
        ? (completedDays.length / scheduledDays.length) * 100
        : 0;

      return {
        id: h.id,
        name: h.name,
        type: h.type,
        active: h.active,
        ageInDays,
        currentStreak,
        completionRate
      };
    });

    // Find inactive habits
    const inactiveHabits: string[] = [];
    for (const habit of activeHabits) {
      const last30 = getLastNDays(30);
      const hasCompletion = last30.some(date =>
        completions.find(c => c.habitId === habit.id && c.date === date && c.completed)
      );
      if (!hasCompletion) {
        inactiveHabits.push(habit.name);
      }
    }

    // Calculate valid days and monthly average
    const validDays = days.filter(date => {
      const habitsForDate = activeHabits.filter(h => isHabitScheduledForDate(h.type, date));
      return habitsForDate.length > 0;
    });

    const monthlyAverage = validDays.length > 0
      ? validDays.map(getDailyCompletion).reduce((a, b) => a + b, 0) / validDays.length
      : 0;

    // Habits added this month
    const currentMonth = today.substring(0, 7);
    const habitsAddedThisMonth = habits.filter(h =>
      h.createdAt.startsWith(currentMonth)
    ).length;

    // Average habit age
    const averageHabitAge = activeHabits.length > 0
      ? activeHabits.reduce((sum, h) => sum + daysSince(h.createdAt.split('T')[0]), 0) / activeHabits.length
      : 0;

    // Longest streak
    const longestStreak = activeHabits.length > 0
      ? Math.max(0, ...activeHabits.map(h => calculateStreak(h.id)))
      : 0;

    // Determine if we have insufficient data
    const daysTracked = validDays.length;
    const hasInsufficientData = daysTracked < 7;

    // Get recent reflections (last 7 days)
    const recentReflections = dailyReflections.filter(r =>
      daysSince(r.date) <= 7
    );

    // Burnout signals summary for AI context
    const burnoutIndicators = detectBurnoutSignals();
    const burnoutSignals = burnoutIndicators.map(b => ({ type: b.type, count: 1 }));

    return {
      habits: enhancedHabits,
      completions,
      weekdayCompletionRate: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
      weekendCompletionRate: weekendCount > 0 ? weekendTotal / weekendCount : 0,
      perfectDays,
      totalDays: validDays.length,
      monthlyAverage,
      bestDay,
      worstDay,
      inactiveHabits,
      userProfile: getUserProfile(),
      totalHabitCount: activeHabits.length,
      habitsAddedThisMonth,
      averageHabitAge,
      longestStreak,
      dropOffPatterns: getDropOffPatterns(),
      hasInsufficientData,
      daysTracked,
      // New context
      insightAdaptation: getInsightAdaptation(),
      recentReflections,
      burnoutSignals,
      momentumMetrics: getMomentumMetrics()
    };
  }, [habits, completions, dailyReflections, getDailyCompletion, getUserProfile, getDropOffPatterns, calculateStreak, getInsightAdaptation, getMomentumMetrics, detectBurnoutSignals]);

  /**
   * Generate weekly insight via AI
   */
  const generateWeeklyInsight = useCallback(async (): Promise<WeeklyInsight | null> => {
    setIsLoadingWeekly(true);

    try {
      const data = prepareInsightData('weekly');

      const { data: response, error } = await supabase.functions.invoke('generate-insight', {
        body: { type: 'weekly', data }
      });

      if (error) throw error;

      if (!response.success || !response.insight) {
        throw new Error(response.error || 'Failed to generate insight');
      }

      const insight: WeeklyInsight = {
        weekStart: getWeekStart(getEffectiveDate()),
        whatWentWell: response.insight.whatWentWell || '',
        frictionPoint: response.insight.frictionPoint || '',
        focusSuggestion: response.insight.focusSuggestion || '',
        keyPhrases: response.insight.keyPhrases || [],
        generatedAt: new Date().toISOString(),
      };

      toast.success('Weekly insight generated!');
      return insight;

    } catch (error) {
      console.error('Error generating weekly insight:', error);

      const message = error instanceof Error ? error.message : 'Failed to generate insight';

      if (message.includes('Rate limit')) {
        toast.error('Rate limit exceeded', { description: 'Please try again later.' });
      } else if (message.includes('credits')) {
        toast.error('AI credits depleted', { description: 'Please add credits to continue.' });
      } else {
        toast.error('Failed to generate insight', { description: message });
      }

      return null;
    } finally {
      setIsLoadingWeekly(false);
    }
  }, [prepareInsightData]);

  /**
   * Generate monthly insight via AI
   */
  const generateMonthlyInsight = useCallback(async (): Promise<MonthlyInsightItem[] | null> => {
    setIsLoadingMonthly(true);

    try {
      const data = prepareInsightData('monthly');

      const { data: response, error } = await supabase.functions.invoke('generate-insight', {
        body: { type: 'monthly', data }
      });

      if (error) throw error;

      if (!response.success || !response.insight) {
        throw new Error(response.error || 'Failed to generate insight');
      }

      // Handle both old string[] format and new object format
      const rawInsights = response.insight.insights || [];
      const insights: MonthlyInsightItem[] = rawInsights.map((item: string | MonthlyInsightItem) => {
        if (typeof item === 'string') {
          return { type: 'observation' as const, text: item };
        }
        return item;
      });

      toast.success('Monthly insight generated!');
      return insights;

    } catch (error) {
      console.error('Error generating monthly insight:', error);

      const message = error instanceof Error ? error.message : 'Failed to generate insight';

      if (message.includes('Rate limit')) {
        toast.error('Rate limit exceeded', { description: 'Please try again later.' });
      } else if (message.includes('credits')) {
        toast.error('AI credits depleted', { description: 'Please add credits to continue.' });
      } else {
        toast.error('Failed to generate insight', { description: message });
      }

      return null;
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [prepareInsightData]);

  /**
   * Generate monthly summary data (without AI)
   */
  const generateMonthlySummary = useCallback((month: string): MonthlySummary | null => {
    const days = getDaysInMonth(month);
    const today = getEffectiveDate();

    const relevantDays = days.filter(d => d <= today);
    if (relevantDays.length === 0) return null;

    let totalPercentage = 0;
    let daysWithHabits = 0;
    let perfectDays = 0;

    const dayStats: { [key: string]: number[] } = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => dayStats[d] = []);

    const habitStats: { [habitId: string]: { scheduled: number; completed: number } } = {};

    for (const date of relevantDays) {
      const habitsForDate = habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
      if (habitsForDate.length === 0) continue;

      daysWithHabits++;
      const percentage = getDailyCompletion(date);
      totalPercentage += percentage;

      const dayName = getDayName(date, true);
      dayStats[dayName].push(percentage);

      if (percentage === 100) perfectDays++;

      for (const habit of habitsForDate) {
        if (!habitStats[habit.id]) {
          habitStats[habit.id] = { scheduled: 0, completed: 0 };
        }
        habitStats[habit.id].scheduled++;

        const completion = completions.find(c => c.habitId === habit.id && c.date === date);
        if (completion?.completed) {
          habitStats[habit.id].completed++;
        }
      }
    }

    if (daysWithHabits === 0) return null;

    const dayAverages = dayNames.map(day => ({
      day,
      avg: dayStats[day].length > 0
        ? dayStats[day].reduce((a, b) => a + b, 0) / dayStats[day].length
        : 0
    }));
    const bestDay = dayAverages.sort((a, b) => b.avg - a.avg)[0]?.day || 'N/A';

    const habitConsistency = habits
      .filter(h => h.active && habitStats[h.id])
      .map(h => ({
        habitId: h.id,
        habitName: h.name,
        completionRate: habitStats[h.id].scheduled > 0
          ? (habitStats[h.id].completed / habitStats[h.id].scheduled) * 100
          : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    return {
      month,
      averageCompletion: totalPercentage / daysWithHabits,
      perfectDays,
      bestPerformingDay: bestDay,
      habitConsistency,
      createdAt: new Date().toISOString(),
    };
  }, [habits, completions, getDailyCompletion]);

  /**
   * Get retirement suggestions with enhanced reasons
   */
  const getRetirementSuggestions = useCallback((): RetirementSuggestion[] => {
    const suggestions: RetirementSuggestion[] = [];

    for (const habit of habits.filter(h => h.active)) {
      const habitCompletions = completions
        .filter(c => c.habitId === habit.id && c.completed)
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastCompletion = habitCompletions[0]?.date;

      if (!lastCompletion) {
        const createdDate = new Date(habit.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceCreation >= 30) {
          suggestions.push({
            habitId: habit.id,
            habitName: habit.name,
            daysSinceLastCompletion: daysSinceCreation,
            suggestedAt: new Date().toISOString(),
            reason: `This habit was created ${daysSinceCreation} days ago but hasn't been completed yet.`
          });
        }
      } else {
        const lastDate = new Date(lastCompletion);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince >= 30) {
          suggestions.push({
            habitId: habit.id,
            habitName: habit.name,
            daysSinceLastCompletion: daysSince,
            suggestedAt: new Date().toISOString(),
            reason: `Last completed ${daysSince} days ago. It might not fit your current routine.`
          });
        }
      }
    }

    return suggestions;
  }, [habits, completions]);

  /**
   * Create insight history entry with lifecycle management
   */
  const createInsightHistoryEntry = useCallback((
    type: 'weekly' | 'monthly',
    summary: string,
    daysTracked: number
  ): InsightHistoryEntry => {
    const now = new Date();
    // Weekly insights expire after the next review cycle (7 days)
    // Monthly summaries never expire but get archived when new month begins
    const expiresAt = type === 'weekly'
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      weekStart: getWeekStart(getEffectiveDate()),
      type,
      summary,
      createdAt: now.toISOString(),
      expiresAt,
      isArchived: false,
      confidenceLevel: getConfidenceLevel(daysTracked)
    };
  }, [getConfidenceLevel]);

  /**
   * Archive expired insights
   */
  const archiveExpiredInsights = useCallback((insightHistory: InsightHistoryEntry[]): InsightHistoryEntry[] => {
    const now = new Date().toISOString();
    return insightHistory.map(entry => {
      if (entry.expiresAt && entry.expiresAt < now && !entry.isArchived) {
        return { ...entry, isArchived: true };
      }
      return entry;
    });
  }, []);

  return {
    isLoadingWeekly,
    isLoadingMonthly,
    generateWeeklyInsight,
    generateMonthlyInsight,
    generateMonthlySummary,
    getRetirementSuggestions,
    getUserProfile,
    getHabitLoadInfo,
    getDropOffPatterns,
    createInsightHistoryEntry,
    // New exports
    getInsightAdaptation,
    getMomentumMetrics,
    detectBurnoutSignals,
    generateMomentumSignals,
    getConfidenceLevel,
    archiveExpiredInsights,
  };
}
