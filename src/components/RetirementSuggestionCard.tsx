import { motion } from 'framer-motion';
import { Moon, X, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RetirementSuggestion } from '@/types/habit';

interface RetirementSuggestionCardProps {
  suggestions: RetirementSuggestion[];
  onPauseHabit: (habitId: string) => void;
  onDismiss: (habitId: string) => void;
}

export function RetirementSuggestionCard({ 
  suggestions, 
  onPauseHabit, 
  onDismiss 
}: RetirementSuggestionCardProps) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-accent/30 border border-accent space-y-3"
    >
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-accent-foreground" />
        <h3 className="text-sm font-medium text-foreground">
          Consider Pausing
        </h3>
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>

      <p className="text-xs text-muted-foreground">
        These habits haven't been completed in 30+ days. You might want to pause them.
      </p>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.habitId}
            className="flex items-center justify-between p-2 rounded-lg bg-background/50"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm text-foreground truncate block">
                {suggestion.habitName}
              </span>
              <span className="text-xs text-muted-foreground">
                {suggestion.daysSinceLastCompletion} days inactive
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPauseHabit(suggestion.habitId)}
                className="h-7 px-2 text-xs"
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(suggestion.habitId)}
                className="h-7 w-7"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
