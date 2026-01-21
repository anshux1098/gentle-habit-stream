import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getLastNDays, getDayName } from '@/lib/dateUtils';

interface WeeklyHeatmapProps {
  getCompletionPercentage: (date: string) => number;
  className?: string;
}

export function WeeklyHeatmap({ getCompletionPercentage, className }: WeeklyHeatmapProps) {
  const last7Days = getLastNDays(7).reverse();

  const getHeatColor = (percentage: number): string => {
    if (percentage === 0) return 'bg-muted';
    if (percentage < 25) return 'bg-success/20';
    if (percentage < 50) return 'bg-success/40';
    if (percentage < 75) return 'bg-success/60';
    if (percentage < 100) return 'bg-success/80';
    return 'bg-success';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">This Week</h3>
      <div className="flex gap-2">
        {last7Days.map((date, index) => {
          const percentage = getCompletionPercentage(date);
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground">
                {getDayName(date, true)}
              </span>
              <div
                className={cn(
                  "w-full aspect-square rounded-lg transition-colors",
                  getHeatColor(percentage)
                )}
                title={`${percentage.toFixed(0)}% completed`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {percentage > 0 ? `${percentage.toFixed(0)}%` : '-'}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
