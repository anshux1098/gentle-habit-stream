import { useState, useEffect, useCallback } from 'react';
import { 
  HabitFlowData, 
  INITIAL_DATA, 
  Habit, 
  Completion, 
  WeeklyReview, 
  FocusHabit, 
  UserSettings, 
  ACHIEVEMENTS,
  MonthlySummary,
  WeeklyInsight
} from '@/types/habit';
import { 
  getEffectiveDate, 
  getLastNDays, 
  isHabitScheduledForDate, 
  isWeekend, 
  getWeekStart, 
  daysSince,
  getCurrentMonth,
  isLastDayOfMonth,
  getPreviousMonth
} from '@/lib/dateUtils';
import { toast } from 'sonner';

const STORAGE_KEY = 'habit-flow-data';
const MAX_BACKUPS = 7;

/**
 * Load data from localStorage
 */
function loadData(): HabitFlowData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with initial data to ensure all fields exist
      return { ...INITIAL_DATA, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
  return INITIAL_DATA;
}

/**
 * Save data to localStorage
 */
function saveData(data: HabitFlowData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

/**
 * Main hook for habit data management
 */
export function useHabitData() {
  const [data, setData] = useState<HabitFlowData>(() => loadData());

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Daily backup (once per day)
  useEffect(() => {
    const today = getEffectiveDate();
    const lastBackup = data.backups[0]?.date;
    
    if (lastBackup !== today && data.habits.length > 0) {
      const backup = {
        date: today,
        data: JSON.stringify({ ...data, backups: [] }),
      };
      
      setData(prev => ({
        ...prev,
        backups: [backup, ...prev.backups].slice(0, MAX_BACKUPS),
      }));
    }
  }, [data.habits.length, data.backups]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add habit
  const addHabit = useCallback((name: string, type: Habit['type'], reminderTime?: string) => {
    const newHabit: Habit = {
      id: generateId(),
      name,
      type,
      createdAt: new Date().toISOString(),
      active: true,
      reminderTime,
    };

    setData(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));

    return newHabit;
  }, [generateId]);

  // Update habit
  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setData(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  }, []);

  // Delete habit
  const deleteHabit = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      completions: prev.completions.filter(c => c.habitId !== id),
      focusHabits: prev.focusHabits.filter(f => f.habitId !== id),
    }));
  }, []);

  // Toggle completion
  const toggleCompletion = useCallback((habitId: string, date: string = getEffectiveDate()) => {
    setData(prev => {
      const existingIndex = prev.completions.findIndex(
        c => c.habitId === habitId && c.date === date
      );

      let newCompletions: Completion[];
      let wasCompleted = false;

      if (existingIndex >= 0) {
        const existing = prev.completions[existingIndex];
        wasCompleted = !existing.completed;
        newCompletions = prev.completions.map((c, i) =>
          i === existingIndex
            ? { ...c, completed: wasCompleted, completedAt: wasCompleted ? new Date().toISOString() : undefined }
            : c
        );
      } else {
        wasCompleted = true;
        newCompletions = [...prev.completions, {
          habitId,
          date,
          completed: true,
          completedAt: new Date().toISOString(),
        }];
      }

      // Check for achievements
      let newAchievements = [...prev.unlockedAchievements];

      // First habit completed
      if (wasCompleted && !newAchievements.includes('first_habit')) {
        newAchievements.push('first_habit');
        if (prev.settings.milestoneCelebrations) {
          setTimeout(() => {
            toast.success('🎉 First Step!', { description: 'You completed your first habit!' });
          }, 300);
        }
      }

      // Check for perfect day
      if (wasCompleted) {
        const habitsForDate = prev.habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
        const completionsForDate = newCompletions.filter(c => c.date === date && c.completed);
        
        if (habitsForDate.length > 0 && completionsForDate.length === habitsForDate.length) {
          if (!newAchievements.includes('first_perfect_day')) {
            newAchievements.push('first_perfect_day');
            if (prev.settings.milestoneCelebrations) {
              setTimeout(() => {
                toast.success('✨ Perfect Day!', { description: 'You completed all your habits today!' });
              }, 300);
            }
          }
        }
      }

      return {
        ...prev,
        completions: newCompletions,
        unlockedAchievements: newAchievements,
      };
    });
  }, []);

  // Get completion status
  const getCompletion = useCallback((habitId: string, date: string = getEffectiveDate()): boolean => {
    const completion = data.completions.find(c => c.habitId === habitId && c.date === date);
    return completion?.completed ?? false;
  }, [data.completions]);

  // Set focus habit
  const setFocusHabit = useCallback((habitId: string | null, date: string = getEffectiveDate()) => {
    setData(prev => {
      const filtered = prev.focusHabits.filter(f => f.date !== date);
      if (habitId) {
        return { ...prev, focusHabits: [...filtered, { date, habitId }] };
      }
      return { ...prev, focusHabits: filtered };
    });
  }, []);

  // Get focus habit
  const getFocusHabit = useCallback((date: string = getEffectiveDate()): string | null => {
    const focus = data.focusHabits.find(f => f.date === date);
    return focus?.habitId ?? null;
  }, [data.focusHabits]);

  // Save review
  const saveReview = useCallback((review: Omit<WeeklyReview, 'weekStart' | 'createdAt'>) => {
    const weekStart = getWeekStart(getEffectiveDate());
    
    setData(prev => {
      const filtered = prev.reviews.filter(r => r.weekStart !== weekStart);
      return {
        ...prev,
        reviews: [...filtered, {
          ...review,
          weekStart,
          createdAt: new Date().toISOString(),
        }],
      };
    });
  }, []);

  // Get review for current week
  const getCurrentReview = useCallback((): WeeklyReview | null => {
    const weekStart = getWeekStart(getEffectiveDate());
    return data.reviews.find(r => r.weekStart === weekStart) ?? null;
  }, [data.reviews]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Calculate streak for a habit
  const calculateStreak = useCallback((habitId: string): number => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const today = getEffectiveDate();
    let streak = 0;
    let currentDate = today;
    let daysChecked = 0;
    const maxDaysToCheck = 365;

    while (daysChecked < maxDaysToCheck) {
      const isScheduled = isHabitScheduledForDate(habit.type, currentDate);
      
      if (isScheduled) {
        const completion = data.completions.find(
          c => c.habitId === habitId && c.date === currentDate && c.completed
        );
        
        if (completion) {
          streak++;
        } else {
          // If it's today and not completed yet, continue checking
          if (currentDate === today) {
            // Don't break yet, just don't count
          } else {
            break; // Streak broken
          }
        }
      }
      
      // Move to previous day
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      currentDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      daysChecked++;
    }

    // Check for streak achievements
    if (streak >= 7 && !data.unlockedAchievements.includes('streak_7')) {
      setData(prev => {
        if (prev.unlockedAchievements.includes('streak_7')) return prev;
        if (prev.settings.milestoneCelebrations) {
          setTimeout(() => {
            toast.success('🔥 Week Warrior!', { description: 'You maintained a 7-day streak!' });
          }, 300);
        }
        return { ...prev, unlockedAchievements: [...prev.unlockedAchievements, 'streak_7'] };
      });
    }

    if (streak >= 30 && !data.unlockedAchievements.includes('streak_30')) {
      setData(prev => {
        if (prev.unlockedAchievements.includes('streak_30')) return prev;
        if (prev.settings.milestoneCelebrations) {
          setTimeout(() => {
            toast.success('🏆 Monthly Master!', { description: 'You maintained a 30-day streak!' });
          }, 300);
        }
        return { ...prev, unlockedAchievements: [...prev.unlockedAchievements, 'streak_30'] };
      });
    }

    return streak;
  }, [data.habits, data.completions, data.unlockedAchievements]);

  // Get habits for a specific date
  const getHabitsForDate = useCallback((date: string = getEffectiveDate()): Habit[] => {
    return data.habits.filter(h => h.active && isHabitScheduledForDate(h.type, date));
  }, [data.habits]);

  // Calculate daily completion percentage
  const getDailyCompletionPercentage = useCallback((date: string = getEffectiveDate()): number => {
    const habitsForDate = getHabitsForDate(date);
    if (habitsForDate.length === 0) return 0;

    const completedCount = habitsForDate.filter(h => {
      const completion = data.completions.find(c => c.habitId === h.id && c.date === date);
      return completion?.completed === true;
    }).length;

    return (completedCount / habitsForDate.length) * 100;
  }, [getHabitsForDate, data.completions]);

  // Get weekly average (last 7 days)
  const getWeeklyAverage = useCallback((): number => {
    const last7Days = getLastNDays(7);
    const dailyPercentages: number[] = [];

    for (const date of last7Days) {
      const habitsForDate = getHabitsForDate(date);
      if (habitsForDate.length > 0) {
        dailyPercentages.push(getDailyCompletionPercentage(date));
      }
    }

    if (dailyPercentages.length === 0) return 0;
    return dailyPercentages.reduce((a, b) => a + b, 0) / dailyPercentages.length;
  }, [getHabitsForDate, getDailyCompletionPercentage]);

  // Get perfect days count
  const getPerfectDaysCount = useCallback((): number => {
    const uniqueDates = [...new Set(data.completions.map(c => c.date))];
    let perfectDays = 0;

    for (const date of uniqueDates) {
      const habitsForDate = getHabitsForDate(date);
      if (habitsForDate.length === 0) continue;

      const allCompleted = habitsForDate.every(h => {
        const completion = data.completions.find(c => c.habitId === h.id && c.date === date);
        return completion?.completed === true;
      });

      if (allCompleted) perfectDays++;
    }

    return perfectDays;
  }, [data.completions, getHabitsForDate]);

  // Get highest streak
  const getHighestStreak = useCallback((): number => {
    if (data.habits.length === 0) return 0;
    return Math.max(0, ...data.habits.filter(h => h.active).map(h => calculateStreak(h.id)));
  }, [data.habits, calculateStreak]);

  // Get completion trend (last 30 days)
  const getCompletionTrend = useCallback((): { date: string; percentage: number }[] => {
    return getLastNDays(30).reverse().map(date => ({
      date,
      percentage: getDailyCompletionPercentage(date),
    }));
  }, [getDailyCompletionPercentage]);

  // Get best performance days
  const getBestPerformanceDays = useCallback((): { day: string; average: number }[] => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData: { [key: number]: number[] } = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    const last30Days = getLastNDays(30);
    for (const date of last30Days) {
      const dayOfWeek = new Date(date).getDay();
      const percentage = getDailyCompletionPercentage(date);
      const habitsForDate = getHabitsForDate(date);
      if (habitsForDate.length > 0) {
        dayData[dayOfWeek].push(percentage);
      }
    }

    return dayNames.map((day, index) => ({
      day,
      average: dayData[index].length > 0
        ? dayData[index].reduce((a, b) => a + b, 0) / dayData[index].length
        : 0,
    }));
  }, [getDailyCompletionPercentage, getHabitsForDate]);

  // Export data
  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  // Import data
  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      setData({ ...INITIAL_DATA, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Reset all data
  const resetAllData = useCallback(() => {
    setData(INITIAL_DATA);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Restore from backup
  const restoreBackup = useCallback((index: number): boolean => {
    const backup = data.backups[index];
    if (!backup) return false;

    try {
      const restored = JSON.parse(backup.data);
      setData({ ...restored, backups: data.backups });
      return true;
    } catch {
      return false;
    }
  }, [data.backups]);

  // Save weekly insight
  const saveWeeklyInsight = useCallback((insight: WeeklyInsight) => {
    setData(prev => ({
      ...prev,
      weeklyInsights: [...prev.weeklyInsights.filter(i => i.weekStart !== insight.weekStart), insight],
    }));
  }, []);

  // Get current week's insight
  const getCurrentWeeklyInsight = useCallback((): WeeklyInsight | null => {
    const weekStart = getWeekStart(getEffectiveDate());
    return data.weeklyInsights?.find(i => i.weekStart === weekStart) ?? null;
  }, [data.weeklyInsights]);

  // Save monthly summary
  const saveMonthlySummary = useCallback((summary: MonthlySummary) => {
    setData(prev => ({
      ...prev,
      monthlySummaries: [...(prev.monthlySummaries || []).filter(s => s.month !== summary.month), summary],
    }));
  }, []);

  // Get monthly summaries
  const getMonthlySummaries = useCallback((): MonthlySummary[] => {
    return data.monthlySummaries || [];
  }, [data.monthlySummaries]);

  // Dismiss retirement suggestion
  const dismissRetirement = useCallback((habitId: string) => {
    setData(prev => ({
      ...prev,
      dismissedRetirements: [...(prev.dismissedRetirements || []), habitId],
    }));
  }, []);

  // Get dismissed retirements
  const getDismissedRetirements = useCallback((): string[] => {
    return data.dismissedRetirements || [];
  }, [data.dismissedRetirements]);

  // Save daily reflection
  const saveDailyReflection = useCallback((date: string, mood: string, reasons: string[]) => {
    setData(prev => ({
      ...prev,
      dailyReflections: [
        ...(prev.dailyReflections || []).filter(r => r.date !== date),
        { date, mood: mood as any, reasons: reasons as any[], createdAt: new Date().toISOString() }
      ].slice(-30) // Keep last 30 days
    }));
  }, []);

  // Get daily reflections
  const getDailyReflections = useCallback(() => {
    return data.dailyReflections || [];
  }, [data.dailyReflections]);

  // Track insight outcome
  const trackInsightOutcome = useCallback((insightId: string, recommendation: string, outcome: string) => {
    setData(prev => ({
      ...prev,
      insightOutcomes: [
        ...(prev.insightOutcomes || []),
        { insightId, recommendation, outcome: outcome as any, recordedAt: new Date().toISOString() }
      ].slice(-20) // Keep last 20 outcomes
    }));
  }, []);

  // Get insight outcomes
  const getInsightOutcomes = useCallback(() => {
    return data.insightOutcomes || [];
  }, [data.insightOutcomes]);

  // Track habit edit for burnout detection
  const trackHabitEdit = useCallback((habitId: string) => {
    setData(prev => ({
      ...prev,
      habitEditHistory: [
        ...(prev.habitEditHistory || []),
        { habitId, editedAt: new Date().toISOString() }
      ].slice(-50) // Keep last 50 edits
    }));
  }, []);

  // Get habit edit history
  const getHabitEditHistory = useCallback(() => {
    return data.habitEditHistory || [];
  }, [data.habitEditHistory]);

  return {
    // Data
    habits: data.habits,
    completions: data.completions,
    settings: data.settings,
    unlockedAchievements: data.unlockedAchievements,
    backups: data.backups,
    monthlySummaries: data.monthlySummaries || [],
    weeklyInsights: data.weeklyInsights || [],
    insightHistory: data.insightHistory || [],
    insightFeedback: data.insightFeedback || [],
    insightOutcomes: data.insightOutcomes || [],
    dailyReflections: data.dailyReflections || [],
    habitEditHistory: data.habitEditHistory || [],

    // Habit management
    addHabit,
    updateHabit,
    deleteHabit,

    // Completion management
    toggleCompletion,
    getCompletion,

    // Focus habit
    setFocusHabit,
    getFocusHabit,

    // Review
    saveReview,
    getCurrentReview,

    // Settings
    updateSettings,

    // Analytics
    calculateStreak,
    getHabitsForDate,
    getDailyCompletionPercentage,
    getWeeklyAverage,
    getPerfectDaysCount,
    getHighestStreak,
    getCompletionTrend,
    getBestPerformanceDays,

    // Insights
    saveWeeklyInsight,
    getCurrentWeeklyInsight,
    saveMonthlySummary,
    getMonthlySummaries,
    dismissRetirement,
    getDismissedRetirements,

    // New: Reflection and outcome tracking
    saveDailyReflection,
    getDailyReflections,
    trackInsightOutcome,
    getInsightOutcomes,
    trackHabitEdit,
    getHabitEditHistory,

    // Data management
    exportData,
    importData,
    resetAllData,
    restoreBackup,
  };
}
