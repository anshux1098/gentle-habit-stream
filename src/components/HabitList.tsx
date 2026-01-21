import { AnimatePresence } from 'framer-motion';
import { HabitItem } from './HabitItem';
import { Habit } from '@/types/habit';
import { useHabits } from '@/contexts/HabitContext';
import { getEffectiveDate } from '@/lib/dateUtils';

interface HabitListProps {
  habits: Habit[];
  date?: string;
  showFocusButton?: boolean;
  readOnly?: boolean;
  emptyMessage?: string;
}

export function HabitList({ 
  habits, 
  date = getEffectiveDate(),
  showFocusButton = true,
  readOnly = false,
  emptyMessage = "No habits to show"
}: HabitListProps) {
  const { getFocusHabit } = useHabits();
  const focusHabitId = getFocusHabit(date);

  // Sort: focus habit first, then by creation date
  const sortedHabits = [...habits].sort((a, b) => {
    if (a.id === focusHabitId) return -1;
    if (b.id === focusHabitId) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sortedHabits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            date={date}
            showFocusButton={showFocusButton}
            readOnly={readOnly}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
