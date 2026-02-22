import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronDown, HelpCircle, Lightbulb, AlertCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WeeklyInsight } from '@/types/habit';

interface WeeklyInsightButtonProps {
  existingInsight?: WeeklyInsight | null;
  isLoading: boolean;
  onGenerate: () => void;
  onApply?: (field: 'whatWentWell' | 'whatSlipped' | 'focusNextWeek', value: string) => void;
}

function HighlightedText({ text, phrases }: { text: string; phrases?: string[] }) {
  if (!phrases || phrases.length === 0) {
    return <span>{text}</span>;
  }

  let result = text;
  phrases.forEach(phrase => {
    const regex = new RegExp(`(${phrase})`, 'gi');
    result = result.replace(regex, '**$1**');
  });

  // Parse bold markers
  const parts = result.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => 
        i % 2 === 1 ? (
          <span key={i} className="font-medium text-foreground">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function WeeklyInsightButton({ 
  existingInsight, 
  isLoading, 
  onGenerate,
  onApply 
}: WeeklyInsightButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

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
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-success" />
                    What went well
                  </h4>
                  <p className="text-sm text-foreground/90">
                    <HighlightedText 
                      text={existingInsight.whatWentWell} 
                      phrases={existingInsight.keyPhrases} 
                    />
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
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-warning" />
                    Friction point
                  </h4>
                  <p className="text-sm text-foreground/90">
                    <HighlightedText 
                      text={existingInsight.frictionPoint} 
                      phrases={existingInsight.keyPhrases} 
                    />
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
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-primary" />
                    Focus suggestion
                  </h4>
                  <p className="text-sm text-foreground/90">
                    <HighlightedText 
                      text={existingInsight.focusSuggestion} 
                      phrases={existingInsight.keyPhrases} 
                    />
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

                {/* Why am I seeing this */}
                <div className="pt-2 border-t border-border">
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
                          This insight was generated based on your habit completion patterns from the past week. 
                          It looks at your daily completion rates, which habits you completed most consistently, 
                          and where you might have faced challenges. These are observations, not judgments — 
                          use what resonates and ignore what doesn't.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
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
