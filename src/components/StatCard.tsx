import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  variant?: 'default' | 'success' | 'streak' | 'focus';
}

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
  variant = 'default'
}: StatCardProps) {
  const variants = {
    default: 'bg-card border-border',
    success: 'bg-success-muted border-success/20',
    streak: 'bg-streak-muted border-streak/20',
    focus: 'bg-focus-muted border-focus/20',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-success',
    streak: 'text-streak',
    focus: 'text-focus',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 card-hover",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <motion.p
            key={String(value)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-foreground"
          >
            {value}
          </motion.p>
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-background/50", iconColors[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
