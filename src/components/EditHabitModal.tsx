import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Habit, HabitType } from '@/types/habit';
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

export function EditHabitModal({ habit, open, onOpenChange, onSave }: EditHabitModalProps) {
  const [name, setName] = useState(habit.name);
  const [type, setType] = useState<HabitType>(habit.type);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '');

  // Reset form when habit changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(habit.name);
      setType(habit.type);
      setReminderTime(habit.reminderTime || '');
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

    if (Object.keys(updates).length > 0) {
      onSave(updates, scheduleChanged);
    }
    onOpenChange(false);
  };

  const hasChanges = name.trim() !== habit.name || type !== habit.type || reminderTime !== (habit.reminderTime || '');

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
