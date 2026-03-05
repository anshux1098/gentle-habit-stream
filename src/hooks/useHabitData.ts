import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
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

/**
 * Calculate goal-based streak in weeks.
 * A week "counts" if the habit was completed >= weeklyTarget times in that week
 * (only counting days it was scheduled and up to today).
 */
function calculateGoalBasedStreakWeeks(
  habitId: string,
  habitType: Habit['type'],
  weeklyTarget: number,
  completions: Completion[]
): number {
  const today = getEffectiveDate();
  const currentWeekStart = getWeekStart(today);

  // Build list of week starts going back up to 52 weeks, most-recent first
  const weekStarts: string[] = [currentWeekStart];
  for (let i = 1; i <= 52; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }

  let streak = 0;
  for (const weekStart of weekStarts) {
    // Collect all 7 days of this week up to today
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (ds <= today) days.push(ds);
    }

    const scheduledDays = days.filter(d => isHabitScheduledForDate(habitType, d));
    if (scheduledDays.length === 0) {
      if (weekStart === currentWeekStart) continue; // current week not started yet
      break;
    }

    const completedCount = scheduledDays.filter(d =>
      completions.some(c => c.habitId === habitId && c.date === d && c.completed)
    ).length;

    if (weekStart === currentWeekStart) {
      // Current week: count it if target already met; otherwise keep streak alive but don't count
      if (completedCount >= weeklyTarget) streak++;
      continue;
    }

    if (completedCount >= weeklyTarget) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

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
  const [data, setData] = useState<HabitFlowData>(INITIAL_DATA);
  useEffect(() => {

    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const user = session.user;

      const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      if (habitsError) {
        console.error("Habit fetch error:", habitsError);
        return;
      }

      const { data: completions, error: completionsError } = await supabase
        .from("completions")
        .select("*")
        .eq("user_id", user.id);

      if (completionsError) {
        console.error("Completion fetch error:", completionsError);
        return;
      }

      // Map habits
      const mappedHabits = (habits || []).map(h => ({
        id: h.id,
        name: h.name,
        type: h.schedule_type,
        createdAt: h.created_at,
        active: true,
        reminderTime: h.reminder_time,
        streakMode: h.streak_mode,
        weeklyTarget: h.weekly_target ?? undefined,
        pausedAt: h.is_paused ? new Date().toISOString() : undefined
      }));

      // 🔥 FIX: Map completions properly
      const mappedCompletions = (completions || []).map(c => ({
        habitId: c.habit_id,
        date: c.date,
        completed: c.completed,
        completedAt: c.completed ? new Date().toISOString() : undefined,
      }));

      setData(prev => ({
        ...prev,
        habits: mappedHabits,
        completions: mappedCompletions,
      }));
    };

    loadUserData();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);
  const addHabit = useCallback(async (
    name: string,
    type: Habit['type'],
    reminderTime?: string,
    streakMode?: Habit['streakMode'],
    weeklyTarget?: number
  ) => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("habits")
      .insert([{
        name,
        schedule_type: type,
        reminder_time: reminderTime ?? null,
        streak_mode: streakMode ?? "strict",
        weekly_target: weeklyTarget ?? null,
        user_id: user.id,   // THIS IS REQUIRED
        is_paused: false,
      }])
      .select()
      .single();

    if (error || !data) {
      console.error("Add habit error:", error);
      return;
    }

    const h = data;

    const newHabit: Habit = {
      id: h.id,
      name: h.name,
      type: h.schedule_type,
      createdAt: h.created_at,
      active: true,
      reminderTime: h.reminder_time,
      streakMode: h.streak_mode,
      weeklyTarget: h.weekly_target ?? undefined,
    };

    // Optimistic: immediately add to state
    setData(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));

  }, []);
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {

    await supabase
      .from("habits")
      .update({
        name: updates.name,
        schedule_type: updates.type,
        reminder_time: updates.reminderTime,
        streak_mode: updates.streakMode,
        weekly_target: updates.weeklyTarget ?? null,
      })
      .eq("id", id);

    setData(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));

  }, []);
  const deleteHabit = useCallback(async (id: string) => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete completions first
    const { error: completionError } = await supabase
      .from("completions")
      .delete()
      .eq("habit_id", id)
      .eq("user_id", user.id);

    if (completionError) {
      console.error("Delete completions error:", completionError);
      return;
    }

    // Delete habit
    const { error: habitError } = await supabase
      .from("habits")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (habitError) {
      console.error("Delete habit error:", habitError);
      return;
    }

    // Update UI only after DB success
    setData(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      completions: prev.completions.filter(c => c.habitId !== id),
    }));

  }, []);
  const pauseHabit = useCallback(async (id: string) => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("habits")
      .update({ is_paused: true })
      .eq("id", id)
      .eq("user_id", user.id);

    setData(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === id ? { ...h, pausedAt: new Date().toISOString() } : h
      ),
    }));

  }, []);
  const unpauseHabit = useCallback(async (id: string) => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("habits")
      .update({ is_paused: false })
      .eq("id", id)
      .eq("user_id", user.id);

    setData(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.id === id ? { ...h, pausedAt: undefined } : h
      ),
    }));

  }, []);
  // Toggle completion (DB-backed + achievements preserved)
  const toggleCompletion = useCallback(async (
    habitId: string,
    date: string = getEffectiveDate()
  ) => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user");
      return;
    }

    // Check existing completion in DB
    const { data: existing } = await supabase
      .from("completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("habit_id", habitId)
      .eq("date", date)
      .maybeSingle();

    let completedValue = true;

    if (existing) {
      completedValue = !existing.completed;
    }

    const { error } = await supabase
      .from("completions")
      .upsert({
        habit_id: habitId,
        date,
        completed: completedValue,
        user_id: user.id,
      });

    if (error) {
      console.error("Completion upsert error:", error);
      return;
    }

    // Refetch completions from DB
    const { data: completions } = await supabase
      .from("completions")
      .select("*")
      .eq("user_id", user.id);

    const mappedCompletions = (completions || []).map(c => ({
      habitId: c.habit_id,
      date: c.date,
      completed: c.completed,
      completedAt: c.completed ? new Date().toISOString() : undefined,
    }));

    // Now update state + achievements
    setData(prev => {

      let newAchievements = [...prev.unlockedAchievements];

      // First habit completed
      if (completedValue && !newAchievements.includes('first_habit')) {
        newAchievements.push('first_habit');
        if (prev.settings.milestoneCelebrations) {
          setTimeout(() => {
            toast.success('🎉 First Step!', { description: 'You completed your first habit!' });
          }, 300);
        }
      }

      // Perfect day check
      if (completedValue) {
        const habitsForDate = prev.habits.filter(h =>
          h.active && isHabitScheduledForDate(h.type, date)
        );

        const completionsForDate = mappedCompletions.filter(
          c => c.date === date && c.completed
        );

        if (
          habitsForDate.length > 0 &&
          completionsForDate.length === habitsForDate.length &&
          !newAchievements.includes('first_perfect_day')
        ) {
          newAchievements.push('first_perfect_day');
          if (prev.settings.milestoneCelebrations) {
            setTimeout(() => {
              toast.success('✨ Perfect Day!', { description: 'You completed all your habits today!' });
            }, 300);
          }
        }
      }

      return {
        ...prev,
        completions: mappedCompletions,
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

  // Calculate streak for a habit — respects streakMode
  const calculateStreak = useCallback((habitId: string): number => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    // Goal-based mode: streak counted in weeks
    if (habit.streakMode === 'goal' && habit.weeklyTarget) {
      return calculateGoalBasedStreakWeeks(habitId, habit.type, habit.weeklyTarget, data.completions);
    }

    // Strict mode (default)
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

  /**
   * Returns current-week progress for a goal-based habit.
   * { completed, target, scheduledThisWeek }
   */
  const getWeeklyGoalProgress = useCallback((habitId: string): { completed: number; target: number; scheduledThisWeek: number } | null => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || habit.streakMode !== 'goal' || !habit.weeklyTarget) return null;

    const today = getEffectiveDate();
    const weekStart = getWeekStart(today);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (ds <= today) days.push(ds);
    }

    const scheduledDays = days.filter(d => isHabitScheduledForDate(habit.type, d));
    const completed = scheduledDays.filter(d =>
      data.completions.some(c => c.habitId === habitId && c.date === d && c.completed)
    ).length;

    return { completed, target: habit.weeklyTarget, scheduledThisWeek: scheduledDays.length };
  }, [data.habits, data.completions]);

  // Get habits for a specific date (excludes paused habits)
  const getHabitsForDate = useCallback((date: string = getEffectiveDate()): Habit[] => {
    return data.habits.filter(h => h.active && !h.pausedAt && isHabitScheduledForDate(h.type, date));
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
    return Math.max(0, ...data.habits.filter(h => h.active && !h.pausedAt).map(h => calculateStreak(h.id)));
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

  // Validate import file structure
  const validateImportData = useCallback((jsonString: string): { valid: boolean; error?: string; data?: HabitFlowData } => {
    try {
      const parsed = JSON.parse(jsonString);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'File must contain a JSON object.' };
      }

      // Required top-level keys
      const required: (keyof HabitFlowData)[] = ['habits', 'completions', 'settings'];
      for (const key of required) {
        if (!(key in parsed)) {
          return { valid: false, error: `Missing required field: "${key}".` };
        }
      }

      if (!Array.isArray(parsed.habits)) {
        return { valid: false, error: '"habits" must be an array.' };
      }
      if (!Array.isArray(parsed.completions)) {
        return { valid: false, error: '"completions" must be an array.' };
      }
      if (typeof parsed.settings !== 'object') {
        return { valid: false, error: '"settings" must be an object.' };
      }

      // Validate each habit has at minimum id, name, type
      for (const habit of parsed.habits) {
        if (!habit.id || !habit.name || !habit.type) {
          return { valid: false, error: 'One or more habits are missing required fields (id, name, type).' };
        }
      }

      // Validate completions have habitId and date
      for (const comp of parsed.completions) {
        if (!comp.habitId || !comp.date) {
          return { valid: false, error: 'One or more completions are missing required fields (habitId, date).' };
        }
      }

      const merged: HabitFlowData = { ...INITIAL_DATA, ...parsed };
      return { valid: true, data: merged };
    } catch {
      return { valid: false, error: 'File is not valid JSON.' };
    }
  }, []);

  // Import data (full replace)
  const importData = useCallback((jsonString: string): { success: boolean; error?: string } => {
    const result = validateImportData(jsonString);
    if (!result.valid || !result.data) {
      return { success: false, error: result.error };
    }
    setData(result.data);
    return { success: true };
  }, [validateImportData]);

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
    habitPauseHistory: data.habitPauseHistory || [],

    // Habit management
    addHabit,
    updateHabit,
    deleteHabit,
    pauseHabit,
    unpauseHabit,

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
    getWeeklyGoalProgress,
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
