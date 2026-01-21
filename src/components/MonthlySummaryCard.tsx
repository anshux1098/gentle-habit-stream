import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Star, Sparkles, Loader2 } from 'lucide-react';
import type { MonthlySummary } from '@/types/habit';
import { getMonthName } from '@/lib/dateUtils';

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  isGeneratingInsight?: boolean;
  onGenerateInsight?: () => void;
}

export function MonthlySummaryCard({ 
  summary, 
  isGeneratingInsight,
  onGenerateInsight 
}: MonthlySummaryCardProps) {
  // Parse month for display
  const [year, month] = summary.month.split('-');
  const displayMonth = getMonthName(`${summary.month}-01`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">
            {displayMonth} {year}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Monthly Summary</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-success" />
          <div className="text-lg font-bold text-foreground">
            {summary.averageCompletion.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Star className="w-4 h-4 mx-auto mb-1 text-warning" />
          <div className="text-lg font-bold text-foreground">
            {summary.perfectDays}
          </div>
          <div className="text-xs text-muted-foreground">Perfect Days</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold text-foreground">
            {summary.bestPerformingDay}
          </div>
          <div className="text-xs text-muted-foreground">Best Day</div>
        </div>
      </div>

      {/* Habit Consistency */}
      {summary.habitConsistency.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Habit Consistency</h4>
          <div className="space-y-1.5">
            {summary.habitConsistency.slice(0, 5).map((habit) => (
              <div key={habit.habitId} className="flex items-center gap-2">
                <span className="text-sm text-foreground flex-1 truncate">
                  {habit.habitName}
                </span>
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${habit.completionRate}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-success"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {habit.completionRate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {summary.aiInsights && summary.aiInsights.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground">AI Insights</h4>
          </div>
          <ul className="space-y-1.5">
            {summary.aiInsights.map((insight, index) => (
              <li 
                key={index} 
                className="text-sm text-foreground/80 pl-3 border-l-2 border-accent"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      ) : onGenerateInsight ? (
        <button
          onClick={onGenerateInsight}
          disabled={isGeneratingInsight}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm text-accent-foreground disabled:opacity-50"
        >
          {isGeneratingInsight ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Insight</span>
            </>
          )}
        </button>
      ) : null}
    </motion.div>
  );
}
