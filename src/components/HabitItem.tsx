import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Pencil } from 'lucide-react';
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
}

export function HabitItem({ 
  habit, 
  date = getEffectiveDate(), 
  showFocusButton = true,
  readOnly = false 
}: HabitItemProps) {
  const { 
    getCompletion, 
    toggleCompletion, 
    getFocusHabit, 
    setFocusHabit,
    calculateStreak,
    updateHabit,
    trackHabitEdit
  } = useHabits();

  const [editOpen, setEditOpen] = useState(false);

  const isCompleted = getCompletion(habit.id, date);
  const isFocused = getFocusHabit(date) === habit.id;
  const streak = calculateStreak(habit.id);

  const handleToggle = () => {
    if (readOnly) return;
    toggleCompletion(habit.id, date);
  };

  const handleFocusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    setFocusHabit(isFocused ? null : habit.id, date);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditOpen(true);
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
        isFocused && "ring-2 ring-focus/30 bg-focus-muted focus-pulse",
        isCompleted && "bg-success-muted border-success/20",
        !readOnly && "cursor-pointer hover:shadow-md"
      )}
      onClick={handleToggle}
    >
      {/* Checkbox */}
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

      {/* Habit name */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-base font-medium transition-all duration-200",
          isCompleted && "text-muted-foreground line-through"
        )}>
          {habit.name}
        </span>

        {/* Streak badge */}
        {streak > 0 && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-streak bg-streak-muted px-2 py-0.5 rounded-full"
          >
            <span className="streak-flame">🔥</span>
            {streak}
          </motion.span>
        )}
      </div>

      {/* Edit button */}
      {!readOnly && (
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
      {showFocusButton && !readOnly && (
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
