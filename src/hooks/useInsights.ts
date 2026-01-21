import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Habit, Completion, WeeklyInsight, MonthlySummary } from '@/types/habit';
import { 
  getEffectiveDate, 
  getWeekStart, 
  getLastNDays, 
  isWeekend, 
  isHabitScheduledForDate,
  getDaysInMonth,
  getCurrentMonth,
  getDayName
} from '@/lib/dateUtils';

interface InsightData {
  habits: Habit[];
  completions: Completion[];
  weekdayCompletionRate: number;
  weekendCompletionRate: number;
  perfectDays: number;
  totalDays: number;
  monthlyAverage: number;
  bestDay: string;
  worstDay: string;
  inactiveHabits: string[];
}

export function useInsights(
  habits: Habit[],
  completions: Completion[],
  getHabitsForDate: (date: string) => Habit[]
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
   * Prepare data for AI insight generation
   */
  const prepareInsightData = useCallback((type: 'weekly' | 'monthly'): InsightData => {
    const today = getEffectiveDate();
    const days = type === 'weekly' ? getLastNDays(7) : getLastNDays(30);
    
    let weekdayTotal = 0;
    let weekdayCount = 0;
    let weekendTotal = 0;
    let weekendCount = 0;
    let perfectDays = 0;

    // Calculate day-by-day stats
    const dayStats: { [key: string]: number[] } = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => dayStats[d] = []);

    for (const date of days) {
      const habitsForDate = habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
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

      // Check if perfect day
      if (percentage === 100) {
        perfectDays++;
      }
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

    // Find inactive habits (no completion in 30 days)
    const inactiveHabits: string[] = [];
    for (const habit of habits.filter(h => h.active)) {
      const last30 = getLastNDays(30);
      const hasCompletion = last30.some(date => 
        completions.find(c => c.habitId === habit.id && c.date === date && c.completed)
      );
      if (!hasCompletion) {
        inactiveHabits.push(habit.name);
      }
    }

    // Calculate monthly average
    const allPercentages = days.map(getDailyCompletion).filter(p => {
      const date = days[days.indexOf(String(p))];
      const habitsForDate = habits.filter(h => h.active && isHabitScheduledForDate(h.type, days[0]));
      return habitsForDate.length > 0;
    });

    const validDays = days.filter(date => {
      const habitsForDate = habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
      return habitsForDate.length > 0;
    });

    const monthlyAverage = validDays.length > 0
      ? validDays.map(getDailyCompletion).reduce((a, b) => a + b, 0) / validDays.length
      : 0;

    return {
      habits,
      completions,
      weekdayCompletionRate: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
      weekendCompletionRate: weekendCount > 0 ? weekendTotal / weekendCount : 0,
      perfectDays,
      totalDays: validDays.length,
      monthlyAverage,
      bestDay,
      worstDay,
      inactiveHabits,
    };
  }, [habits, completions, getDailyCompletion]);

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
  const generateMonthlyInsight = useCallback(async (): Promise<string[] | null> => {
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

      const insights = response.insight.insights || [];
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
    
    // Only include days up to today
    const relevantDays = days.filter(d => d <= today);
    if (relevantDays.length === 0) return null;

    let totalPercentage = 0;
    let daysWithHabits = 0;
    let perfectDays = 0;

    // Day stats for best performing day
    const dayStats: { [key: string]: number[] } = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => dayStats[d] = []);

    // Habit consistency tracking
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

      // Track per-habit stats
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

    // Calculate best performing day
    const dayAverages = dayNames.map(day => ({
      day,
      avg: dayStats[day].length > 0 
        ? dayStats[day].reduce((a, b) => a + b, 0) / dayStats[day].length 
        : 0
    }));
    const bestDay = dayAverages.sort((a, b) => b.avg - a.avg)[0]?.day || 'N/A';

    // Calculate habit consistency
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
   * Get retirement suggestions (habits inactive for 30+ days)
   */
  const getRetirementSuggestions = useCallback(() => {
    const suggestions: Array<{
      habitId: string;
      habitName: string;
      daysSinceLastCompletion: number;
      suggestedAt: string;
    }> = [];

    for (const habit of habits.filter(h => h.active)) {
      // Find last completion
      const habitCompletions = completions
        .filter(c => c.habitId === habit.id && c.completed)
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastCompletion = habitCompletions[0]?.date;
      
      if (!lastCompletion) {
        // Check if habit is older than 30 days
        const createdDate = new Date(habit.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceCreation >= 30) {
          suggestions.push({
            habitId: habit.id,
            habitName: habit.name,
            daysSinceLastCompletion: daysSinceCreation,
            suggestedAt: new Date().toISOString(),
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
          });
        }
      }
    }

    return suggestions;
  }, [habits, completions]);

  return {
    isLoadingWeekly,
    isLoadingMonthly,
    generateWeeklyInsight,
    generateMonthlyInsight,
    generateMonthlySummary,
    getRetirementSuggestions,
  };
}
