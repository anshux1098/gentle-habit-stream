import { motion } from 'framer-motion';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

interface InsightConfidenceBadgeProps {
  level: 'low' | 'medium' | 'high';
  daysTracked?: number;
}

const configMap = {
  low: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/30',
    label: 'Early insights',
    tooltip: 'Based on limited data. Patterns will become clearer over time.',
  },
  medium: {
    icon: Info,
    color: 'text-primary',
    bg: 'bg-primary/10',
    label: 'Growing confidence',
    tooltip: 'Based on moderate data. Insights are becoming more reliable.',
  },
  high: {
    icon: CheckCircle,
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'High confidence',
    tooltip: 'Based on substantial tracking history.',
  },
};

export function InsightConfidenceBadge({ level, daysTracked }: InsightConfidenceBadgeProps) {
  const config = configMap[level];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg}`}
      title={config.tooltip}
    >
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-xs ${config.color}`}>
        {config.label}
        {daysTracked !== undefined && level === 'low' && (
          <span className="text-muted-foreground"> ({daysTracked} days)</span>
        )}
      </span>
    </motion.div>
  );
}
