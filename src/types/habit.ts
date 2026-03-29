// Habit Flow - Core Data Types

export type HabitType = 'daily' | 'weekday' | 'weekend';

export type StreakMode = 'strict' | 'goal';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  createdAt: string; // ISO timestamp
  active: boolean;
  pausedAt?: string; // ISO timestamp — when habit was paused
  reminderTime?: string; // HH:MM format
  streakMode?: StreakMode; // defaults to 'strict' for backward compatibility
  weeklyTarget?: number; // only used when streakMode === 'goal'; e.g. 5 means 5 out of 7 days
  motivation?: string; // optional "why" — user's reason for this habit
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

// Monthly Summary (auto-generated at end of month)
export interface MonthlySummary {
  month: string; // YYYY-MM
  averageCompletion: number;
  perfectDays: number;
  bestPerformingDay: string;
  habitConsistency: { habitId: string; habitName: string; completionRate: number }[];
  createdAt: string;
  aiInsights?: MonthlyInsightItem[]; // Enhanced AI-generated insights
}

// Enhanced monthly insight item with type and highlight
export interface MonthlyInsightItem {
  type: 'observation' | 'positive' | 'recommendation';
  text: string;
  highlight?: string;
}

// AI-generated weekly insight
export interface WeeklyInsight {
  weekStart: string; // YYYY-MM-DD
  whatWentWell: string;
  frictionPoint: string;
  focusSuggestion: string;
  keyPhrases?: string[]; // Key phrases to highlight
  generatedAt: string;
}

// Habit load level
export type HabitLoadLevel = 'light' | 'balanced' | 'heavy';

// Habit load explanation
export interface HabitLoadExplanation {
  reason: 'too_many_habits' | 'low_completion' | 'both';
  suggestion: 'pause' | 'reduce_frequency' | 'lower_goals';
  message: string;
}

// User behavior profile for personalized insights
export type UserProfile = 'beginner' | 'consistent' | 'struggling';

// Habit retirement suggestion
export interface RetirementSuggestion {
  habitId: string;
  habitName: string;
  daysSinceLastCompletion: number;
  suggestedAt: string;
  reason: string;
}

// Insight feedback for history
export type InsightFeedback = 'helpful' | 'neutral' | 'not_useful';

// Insight outcome tracking - what users did after receiving recommendations
export type InsightOutcome = 'habit_paused' | 'frequency_reduced' | 'no_change';

// Track insight recommendation outcomes
export interface InsightOutcomeEntry {
  insightId: string;
  recommendation: string;
  outcome: InsightOutcome;
  recordedAt: string;
}

// Insight adaptation level based on user behavior
export type InsightAdaptation = 'simplified' | 'standard' | 'advanced';

// Historical insight entry with lifecycle status
export interface InsightHistoryEntry {
  id: string;
  weekStart: string;
  type: 'weekly' | 'monthly';
  summary: string;
  feedback?: InsightFeedback;
  createdAt: string;
  expiresAt?: string; // For lifecycle management
  isArchived?: boolean; // Whether it's been superseded
  confidenceLevel?: 'low' | 'medium' | 'high'; // Based on data volume
}

// Momentum signal for recovery and consistency tracking
export interface MomentumSignal {
  type: 'recovery' | 'consistency' | 'identity_shift';
  message: string;
  metric?: number;
  habitName?: string;
  generatedAt: string;
}

// Burnout indicator with energy-focused framing
export interface BurnoutIndicator {
  type: 'same_day_failures' | 'declining_completion' | 'excessive_edits';
  severity: 'mild' | 'moderate' | 'concerning';
  message: string;
  suggestion: string;
  detectedAt: string;
}

// Low-friction reflection input
export type ReflectionMood = '😊' | '😐' | '😔' | '😤' | '😴';
export type ReflectionReason = 'time' | 'energy' | 'motivation' | 'environment' | 'other';

export interface DailyReflection {
  date: string;
  mood?: ReflectionMood;
  reasons?: ReflectionReason[];
  createdAt: string;
}

export interface HabitFlowData {
  habits: Habit[];
  completions: Completion[];
  reviews: WeeklyReview[];
  focusHabits: FocusHabit[];
  settings: UserSettings;
  unlockedAchievements: string[]; // Achievement IDs
  backups: { date: string; data: string }[];
  monthlySummaries: MonthlySummary[];
  weeklyInsights: WeeklyInsight[];
  dismissedRetirements: string[]; // Habit IDs the user dismissed
  insightHistory: InsightHistoryEntry[]; // Last 4 weeks of insights
  insightFeedback: { insightId: string; feedback: InsightFeedback }[]; // User feedback on insights
  insightOutcomes: InsightOutcomeEntry[]; // Track recommendation outcomes
  dailyReflections: DailyReflection[]; // Low-friction reflection inputs
  habitEditHistory: { habitId: string; editedAt: string }[]; // Track habit edits for burnout detection
  habitPauseHistory: { habitId: string; action: 'pause' | 'unpause'; at: string }[]; // Track pause/unpause events
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
  monthlySummaries: [],
  weeklyInsights: [],
  dismissedRetirements: [],
  insightHistory: [],
  insightFeedback: [],
  insightOutcomes: [],
  dailyReflections: [],
  habitEditHistory: [],
  habitPauseHistory: [],
};
