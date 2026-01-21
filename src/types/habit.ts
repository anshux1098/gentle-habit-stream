// Habit Flow - Core Data Types

export type HabitType = 'daily' | 'weekday' | 'weekend';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  createdAt: string; // ISO timestamp
  active: boolean;
  reminderTime?: string; // HH:MM format
}

export interface Completion {
  habitId: string;
  date: string; // YYYY-MM-DD based on 4AM reset
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export interface WeeklyReview {
  weekStart: string; // YYYY-MM-DD (Monday of the week)
  whatWentWell: string;
  whatSlipped: string;
  focusNextWeek: string;
  createdAt: string;
}

export interface FocusHabit {
  date: string; // YYYY-MM-DD based on 4AM reset
  habitId: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  percentagePrecision: 0 | 1 | 2;
  notificationsEnabled: boolean;
  milestoneCelebrations: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string; // ISO timestamp
}

export interface HabitFlowData {
  habits: Habit[];
  completions: Completion[];
  reviews: WeeklyReview[];
  focusHabits: FocusHabit[];
  settings: UserSettings;
  unlockedAchievements: string[]; // Achievement IDs
  backups: { date: string; data: string }[];
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  percentagePrecision: 0,
  notificationsEnabled: false,
  milestoneCelebrations: true,
};

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_habit',
    name: 'First Step',
    description: 'Completed your first habit',
  },
  {
    id: 'first_perfect_day',
    name: 'Perfect Day',
    description: 'Completed all habits in a single day',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintained a 30-day streak',
  },
];

// Initial state
export const INITIAL_DATA: HabitFlowData = {
  habits: [],
  completions: [],
  reviews: [],
  focusHabits: [],
  settings: DEFAULT_SETTINGS,
  unlockedAchievements: [],
  backups: [],
};
