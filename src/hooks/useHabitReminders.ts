import { useEffect, useRef, useCallback } from 'react';
import { useHabits } from '@/contexts/HabitContext';
import { getEffectiveDate, isHabitScheduledForDate } from '@/lib/dateUtils';

const SENT_KEY = 'habit-flow-reminders-sent';

/**
 * Get the set of "habitId::date" keys already notified today.
 */
function getSentToday(today: string): Set<string> {
  try {
    const stored = localStorage.getItem(SENT_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    // Reset if stored date doesn't match today
    if (parsed.date !== today) return new Set();
    return new Set<string>(parsed.keys ?? []);
  } catch {
    return new Set();
  }
}

function markSent(today: string, key: string) {
  const sent = getSentToday(today);
  sent.add(key);
  localStorage.setItem(SENT_KEY, JSON.stringify({ date: today, keys: [...sent] }));
}

/**
 * Hook that checks every 30 seconds whether any habit reminder should fire.
 * Requirements:
 * - Habit must be active and not paused
 * - Habit must be scheduled for today
 * - Habit must not be completed today
 * - Reminder must not have been sent today already (max 1 per habit per day)
 * - Current time must be at or past the reminderTime (HH:MM)
 * - Notifications must be enabled in settings and granted by browser
 */
export function useHabitReminders() {
  const {
    habits,
    completions,
    settings,
    getCompletion,
    getFocusHabit,
  } = useHabits();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReminders = useCallback(() => {
    // Guard: notifications not enabled or not granted
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = getEffectiveDate();
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const focusHabitId = getFocusHabit(today);
    const sent = getSentToday(today);

    for (const habit of habits) {
      // Skip if no reminder time set
      if (!habit.reminderTime) continue;

      // Skip paused or inactive
      if (!habit.active || habit.pausedAt) continue;

      // Skip if not scheduled today
      if (!isHabitScheduledForDate(habit.type, today)) continue;

      // Skip if already completed today
      if (getCompletion(habit.id, today)) continue;

      // Skip if already notified today
      const key = `${habit.id}::${today}`;
      if (sent.has(key)) continue;

      // Fire only when current time matches or has just passed the reminder time
      // (within last 2 minutes to avoid missing it between checks)
      if (currentHHMM < habit.reminderTime) continue;

      // Check we're within a 2-min window so old reminders don't fire on app open
      const [rh, rm] = habit.reminderTime.split(':').map(Number);
      const reminderMinutes = rh * 60 + rm;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (nowMinutes - reminderMinutes > 2) continue;

      // Fire notification
      const isFocus = focusHabitId === habit.id;
      const body = isFocus
        ? `Time for your Focus Habit: ${habit.name}`
        : `You planned "${habit.name}" for today.`;

      try {
        new Notification('Habit Flow', {
          body,
          icon: '/favicon.ico',
          tag: key, // prevents duplicate OS-level notifications
          silent: false,
        });
        markSent(today, key);
      } catch {
        // Notification constructor can throw in some environments
      }
    }
  }, [habits, completions, settings.notificationsEnabled, getCompletion, getFocusHabit]);

  useEffect(() => {
    // Run immediately on mount and then every 30 seconds
    checkReminders();
    intervalRef.current = setInterval(checkReminders, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkReminders]);
}
