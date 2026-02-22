import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Pencil, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/habit';
import { useHabits } from '@/contexts/HabitContext';
import { getEffectiveDate } from '@/lib/dateUtils';
import { EditHabitModal } from './EditHabitModal';

interface HabitItemProps {
  habit: Habit;
  date?: string;
  showFocusButton?: boolean;
  readOnly?: boolean;
  isPaused?: boolean;
}

export function HabitItem({ 
  habit, 
  date = getEffectiveDate(), 
  showFocusButton = true,
  readOnly = false,
  isPaused = false
}: HabitItemProps) {
  const { 
    getCompletion, 
    toggleCompletion, 
    getFocusHabit, 
    setFocusHabit,
    calculateStreak,
    getWeeklyGoalProgress,
    updateHabit,
    trackHabitEdit,
    pauseHabit,
    unpauseHabit
  } = useHabits();

  const [editOpen, setEditOpen] = useState(false);

  const isCompleted = isPaused ? false : getCompletion(habit.id, date);
  const isFocused = isPaused ? false : getFocusHabit(date) === habit.id;
  const streak = isPaused ? 0 : calculateStreak(habit.id);
  const isGoalMode = habit.streakMode === 'goal';
  const goalProgress = (!isPaused && isGoalMode) ? getWeeklyGoalProgress(habit.id) : null;

  const handleToggle = () => {
    if (readOnly || isPaused) return;
    toggleCompletion(habit.id, date);
  };

  const handleFocusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly || isPaused) return;
    setFocusHabit(isFocused ? null : habit.id, date);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditOpen(true);
  };

  const handlePauseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      unpauseHabit(habit.id);
    } else {
      pauseHabit(habit.id);
    }
  };

  const handleEditSave = (updates: Partial<Habit>, scheduleChanged: boolean) => {
    updateHabit(habit.id, updates);
    trackHabitEdit(habit.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "bg-card border border-border/50",
        isPaused && "opacity-60",
        !isPaused && isFocused && "ring-2 ring-focus/30 bg-focus-muted focus-pulse",
        !isPaused && isCompleted && "bg-success-muted border-success/20",
        !readOnly && !isPaused && "cursor-pointer hover:shadow-md"
      )}
      onClick={handleToggle}
    >
      {/* Checkbox */}
      {!isPaused && (
        <motion.div
          className={cn(
            "habit-checkbox flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            isCompleted 
              ? "bg-success border-success" 
              : "border-pending bg-transparent hover:border-success/50"
          )}
          whileTap={!readOnly ? { scale: 0.9 } : undefined}
        >
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="w-4 h-4 text-success-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Paused icon */}
      {isPaused && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
          <Pause className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}

      {/* Habit name */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-base font-medium transition-all duration-200",
          isPaused && "text-muted-foreground",
          !isPaused && isCompleted && "text-muted-foreground line-through"
        )}>
          {habit.name}
        </span>

        {/* Streak badge — strict mode */}
        {!isPaused && !isGoalMode && streak > 0 && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-streak bg-streak-muted px-2 py-0.5 rounded-full"
          >
            <span className="streak-flame">🔥</span>
            {streak}d
          </motion.span>
        )}

        {/* Goal progress badge */}
        {!isPaused && isGoalMode && goalProgress && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "ml-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              goalProgress.completed >= goalProgress.target
                ? "text-streak bg-streak-muted"
                : "text-muted-foreground bg-muted"
            )}
          >
            {goalProgress.completed >= goalProgress.target && <span className="streak-flame">🔥</span>}
            {goalProgress.completed}/{goalProgress.target}
          </motion.span>
        )}
      </div>

      {/* Pause/Unpause button */}
      {!readOnly && (
        <button
          onClick={handlePauseToggle}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg transition-all duration-200",
            isPaused
              ? "text-primary hover:text-primary/80"
              : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
          )}
          aria-label={isPaused ? "Resume habit" : "Pause habit"}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      )}

      {/* Edit button */}
      {!readOnly && !isPaused && (
        <button
          onClick={handleEditClick}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg transition-all duration-200",
            "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
          )}
          aria-label="Edit habit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Focus star button */}
      {showFocusButton && !readOnly && !isPaused && (
        <button
          onClick={handleFocusToggle}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-lg transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            isFocused && "opacity-100"
          )}
          aria-label={isFocused ? "Remove focus" : "Set as focus habit"}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-all duration-200",
              isFocused 
                ? "fill-focus text-focus" 
                : "text-muted-foreground hover:text-focus"
            )}
          />
        </button>
      )}

      {/* Edit Modal */}
      <EditHabitModal
        habit={habit}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleEditSave}
      />
    </motion.div>
  );
}
