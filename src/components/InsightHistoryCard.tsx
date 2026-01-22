import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InsightHistoryEntry, InsightFeedback } from '@/types/habit';
import { getMonthName, getDayName } from '@/lib/dateUtils';

interface InsightHistoryCardProps {
  history: InsightHistoryEntry[];
  onFeedback: (insightId: string, feedback: InsightFeedback) => void;
  getFeedback: (insightId: string) => InsightFeedback | undefined;
}

function formatWeekDate(weekStart: string): string {
  const monthName = getMonthName(weekStart, true);
  const day = parseInt(weekStart.split('-')[2], 10);
  return `Week of ${monthName} ${day}`;
}

const feedbackConfig: Record<InsightFeedback, { icon: typeof ThumbsUp; label: string; color: string }> = {
  helpful: { icon: ThumbsUp, label: 'Helpful', color: 'text-success' },
  neutral: { icon: Minus, label: 'Neutral', color: 'text-muted-foreground' },
  not_useful: { icon: ThumbsDown, label: 'Not useful', color: 'text-destructive' },
};

export function InsightHistoryCard({ 
  history, 
  onFeedback, 
  getFeedback 
}: InsightHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) return null;

  // Show last 4 weeks
  const recentHistory = history.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Insight History</span>
          <span className="text-xs text-muted-foreground">
            Last {recentHistory.length} week{recentHistory.length !== 1 ? 's' : ''}
          </span>
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
            <div className="p-3 space-y-3">
              {recentHistory.map((entry) => {
                const currentFeedback = getFeedback(entry.id);
                
                return (
                  <div 
                    key={entry.id}
                    className="p-3 rounded-lg bg-background/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatWeekDate(entry.weekStart)}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {entry.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground/90 line-clamp-2">
                      {entry.summary}
                    </p>

                    {/* Feedback buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground mr-1">Was this helpful?</span>
                      {(['helpful', 'neutral', 'not_useful'] as InsightFeedback[]).map((fb) => {
                        const config = feedbackConfig[fb];
                        const Icon = config.icon;
                        const isSelected = currentFeedback === fb;
                        
                        return (
                          <Button
                            key={fb}
                            variant="ghost"
                            size="sm"
                            onClick={() => onFeedback(entry.id, fb)}
                            className={`h-7 px-2 ${isSelected ? config.color : 'text-muted-foreground/50'}`}
                            title={config.label}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Your feedback helps improve future insights
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
