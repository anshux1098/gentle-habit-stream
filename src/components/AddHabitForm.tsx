import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useHabits } from '@/contexts/HabitContext';
import { HabitType, StreakMode } from '@/types/habit';
import { cn } from '@/lib/utils';

interface AddHabitFormProps {
  onClose?: () => void;
  className?: string;
}

const WEEKLY_TARGET_OPTIONS = [2, 3, 4, 5, 6];

export function AddHabitForm({ onClose, className }: AddHabitFormProps) {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>('daily');
  const [reminderTime, setReminderTime] = useState('');
  const [streakMode, setStreakMode] = useState<StreakMode>('strict');
  const [weeklyTarget, setWeeklyTarget] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit(
      name.trim(),
      type,
      reminderTime || undefined,
      streakMode,
      streakMode === 'goal' ? weeklyTarget : undefined
    );
    setName('');
    setType('daily');
    setReminderTime('');
    setStreakMode('strict');
    setWeeklyTarget(5);
    setIsExpanded(false);
    onClose?.();
  };

  const handleCancel = () => {
    setName('');
    setType('daily');
    setReminderTime('');
    setStreakMode('strict');
    setWeeklyTarget(5);
    setIsExpanded(false);
    onClose?.();
  };

  if (!isExpanded) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full p-4 rounded-xl border-2 border-dashed border-border",
          "flex items-center justify-center gap-2",
          "text-muted-foreground hover:text-foreground hover:border-primary/30",
          "transition-all duration-200",
          className
        )}
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add new habit</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.form
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        onSubmit={handleSubmit}
        className={cn(
          "p-4 rounded-xl border border-border bg-card space-y-4",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">New Habit</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="habit-name">Habit name</Label>
          <Input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning meditation"
            autoFocus
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label>Schedule</Label>
          <RadioGroup value={type} onValueChange={(v) => setType(v as HabitType)}>
            <div className="flex flex-wrap gap-2">
              <label className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                type === 'daily' ? "bg-primary/10 border-primary" : "bg-background border-border hover:border-primary/30"
              )}>
                <RadioGroupItem value="daily" className="sr-only" />
                <span className="text-sm font-medium">Daily</span>
              </label>
              <label className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                type === 'weekday' ? "bg-primary/10 border-primary" : "bg-background border-border hover:border-primary/30"
              )}>
                <RadioGroupItem value="weekday" className="sr-only" />
                <span className="text-sm font-medium">Weekdays</span>
              </label>
              <label className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                type === 'weekend' ? "bg-primary/10 border-primary" : "bg-background border-border hover:border-primary/30"
              )}>
                <RadioGroupItem value="weekend" className="sr-only" />
                <span className="text-sm font-medium">Weekends</span>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Streak Mode */}
        <div className="space-y-2">
          <Label>Streak mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStreakMode('strict')}
              className={cn(
                "flex flex-col items-start gap-0.5 p-3 rounded-lg border text-sm transition-all text-left",
                streakMode === 'strict'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              )}
            >
              <span className="font-medium">Strict</span>
              <span className="text-xs opacity-70">Every scheduled day</span>
            </button>
            <button
              type="button"
              onClick={() => setStreakMode('goal')}
              className={cn(
                "flex flex-col items-start gap-0.5 p-3 rounded-lg border text-sm transition-all text-left",
                streakMode === 'goal'
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              )}
            >
              <span className="font-medium">Goal-based</span>
              <span className="text-xs opacity-70">X times per week</span>
            </button>
          </div>

          {streakMode === 'goal' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-1 space-y-2"
            >
              <Label className="text-xs text-muted-foreground">Weekly target</Label>
              <div className="flex gap-2">
                {WEEKLY_TARGET_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWeeklyTarget(t)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                      weeklyTarget === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {t}×
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Streak continues each week you hit {weeklyTarget}+ completions.
              </p>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder-time">Reminder time (optional)</Label>
          <Input
            id="reminder-time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()} className="flex-1">
            Add Habit
          </Button>
        </div>
      </motion.form>
    </AnimatePresence>
  );
}
