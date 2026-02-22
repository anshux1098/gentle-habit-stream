import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Habit, HabitType, StreakMode } from '@/types/habit';
import { cn } from '@/lib/utils';

interface EditHabitModalProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Habit>, scheduleChanged: boolean) => void;
}

const SCHEDULE_OPTIONS: { value: HabitType; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekday', label: 'Weekdays', description: 'Mon–Fri' },
  { value: 'weekend', label: 'Weekends', description: 'Sat–Sun' },
];

const WEEKLY_TARGET_OPTIONS = [2, 3, 4, 5, 6];

export function EditHabitModal({ habit, open, onOpenChange, onSave }: EditHabitModalProps) {
  const [name, setName] = useState(habit.name);
  const [type, setType] = useState<HabitType>(habit.type);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '');
  const [streakMode, setStreakMode] = useState<StreakMode>(habit.streakMode ?? 'strict');
  const [weeklyTarget, setWeeklyTarget] = useState(habit.weeklyTarget ?? 5);

  // Reset form when habit changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(habit.name);
      setType(habit.type);
      setReminderTime(habit.reminderTime || '');
      setStreakMode(habit.streakMode ?? 'strict');
      setWeeklyTarget(habit.weeklyTarget ?? 5);
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const scheduleChanged = type !== habit.type;
    const updates: Partial<Habit> = {};

    if (trimmedName !== habit.name) updates.name = trimmedName;
    if (type !== habit.type) updates.type = type;
    if (reminderTime !== (habit.reminderTime || '')) {
      updates.reminderTime = reminderTime || undefined;
    }
    if (streakMode !== (habit.streakMode ?? 'strict')) {
      updates.streakMode = streakMode;
    }
    if (streakMode === 'goal' && weeklyTarget !== (habit.weeklyTarget ?? 5)) {
      updates.weeklyTarget = weeklyTarget;
    }
    if (streakMode === 'strict' && habit.streakMode === 'goal') {
      updates.weeklyTarget = undefined;
    }
    // Always sync streakMode if switching
    if (streakMode !== (habit.streakMode ?? 'strict')) {
      updates.streakMode = streakMode;
      updates.weeklyTarget = streakMode === 'goal' ? weeklyTarget : undefined;
    }

    if (Object.keys(updates).length > 0) {
      onSave(updates, scheduleChanged);
    }
    onOpenChange(false);
  };

  const hasChanges =
    name.trim() !== habit.name ||
    type !== habit.type ||
    reminderTime !== (habit.reminderTime || '') ||
    streakMode !== (habit.streakMode ?? 'strict') ||
    (streakMode === 'goal' && weeklyTarget !== (habit.weeklyTarget ?? 5));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name"
              maxLength={60}
            />
          </div>

          {/* Schedule Type */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <div className="grid grid-cols-3 gap-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all",
                    type === opt.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.description}</span>
                </button>
              ))}
            </div>
            {type !== habit.type && (
              <p className="text-xs text-muted-foreground mt-1">
                Changing schedule preserves your completion history. Your streak will continue on the new schedule.
              </p>
            )}
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
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
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
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
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
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
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

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Reminder time (optional)</Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !hasChanges}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
