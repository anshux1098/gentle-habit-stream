import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, X, Pause, HelpCircle, ChevronDown } from 'lucide-react';
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
  const [showWhy, setShowWhy] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) return null;

  const toggleItemExpanded = (habitId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(habitId)) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });
  };

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
        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
          Optional
        </span>
      </div>

      {/* Why am I seeing this */}
      <div>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          Why am I seeing this?
          <motion.span
            animate={{ rotate: showWhy ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.span>
        </button>
        
        <AnimatePresence>
          {showWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-xs text-muted-foreground bg-background/50 p-2 rounded">
                These habits haven't been completed in 30+ days. This might mean they no longer 
                fit your current routine or priorities. Pausing them can help reduce mental load 
                and let you focus on habits that matter most right now. You can always reactivate 
                them later — this isn't permanent.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.habitId}
            className="rounded-lg bg-background/50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-2">
              <button
                onClick={() => toggleItemExpanded(suggestion.habitId)}
                className="flex-1 min-w-0 text-left flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate block">
                    {suggestion.habitName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.daysSinceLastCompletion} days inactive
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: expandedItems.has(suggestion.habitId) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </motion.div>
              </button>
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
                  title="Keep this habit active"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {expandedItems.has(suggestion.habitId) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-2">
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      {suggestion.reason}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/70 text-center pt-1 border-t border-border/50">
        Dismissing keeps the habit active — you're in control
      </p>
    </motion.div>
  );
}
