import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WeeklyInsight } from '@/types/habit';

interface WeeklyInsightButtonProps {
  existingInsight?: WeeklyInsight | null;
  isLoading: boolean;
  onGenerate: () => void;
  onApply?: (field: 'whatWentWell' | 'whatSlipped' | 'focusNextWeek', value: string) => void;
}

export function WeeklyInsightButton({ 
  existingInsight, 
  isLoading, 
  onGenerate,
  onApply 
}: WeeklyInsightButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (existingInsight && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-accent/50 overflow-hidden"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-accent/20 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium text-foreground">AI Weekly Insight</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 bg-accent/10">
                {/* What went well */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    ✨ What went well
                  </h4>
                  <p className="text-sm text-foreground/90">
                    {existingInsight.whatWentWell}
                  </p>
                  {onApply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApply('whatWentWell', existingInsight.whatWentWell)}
                      className="h-7 text-xs"
                    >
                      Use this
                    </Button>
                  )}
                </div>

                {/* Friction point */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    🔄 Friction point
                  </h4>
                  <p className="text-sm text-foreground/90">
                    {existingInsight.frictionPoint}
                  </p>
                  {onApply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApply('whatSlipped', existingInsight.frictionPoint)}
                      className="h-7 text-xs"
                    >
                      Use this
                    </Button>
                  )}
                </div>

                {/* Focus suggestion */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    🎯 Focus suggestion
                  </h4>
                  <p className="text-sm text-foreground/90">
                    {existingInsight.focusSuggestion}
                  </p>
                  {onApply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApply('focusNextWeek', existingInsight.focusSuggestion)}
                      className="h-7 text-xs"
                    >
                      Use this
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  You can use, edit, or ignore these suggestions
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={onGenerate}
      disabled={isLoading}
      className="w-full flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating insight...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          <span>Generate Weekly Insight</span>
        </>
      )}
    </Button>
  );
}
