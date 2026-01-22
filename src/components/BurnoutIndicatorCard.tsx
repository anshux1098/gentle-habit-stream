import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryWarning, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { BurnoutIndicator } from '@/types/habit';

interface BurnoutIndicatorCardProps {
  indicator: BurnoutIndicator;
  onDismiss?: () => void;
}

const severityConfig = {
  mild: { 
    icon: Battery, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border'
  },
  moderate: { 
    icon: BatteryLow, 
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30'
  },
  concerning: { 
    icon: BatteryWarning, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30'
  },
};

const typeExplanations = {
  same_day_failures: "We noticed multiple habits were missed on the same days. This often indicates that certain days may be particularly demanding.",
  declining_completion: "Your completion rate has been gradually decreasing while your habit count stays the same. This can happen when life gets busier.",
  excessive_edits: "You've been editing your habits frequently. Sometimes this means the current setup isn't quite working for you.",
};

export function BurnoutIndicatorCard({ indicator, onDismiss }: BurnoutIndicatorCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const config = severityConfig[indicator.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-background/50 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            {indicator.message}
          </p>
          
          <div className="mt-3 p-2.5 rounded-lg bg-background/50">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-medium">You might consider:</span> {indicator.suggestion}
            </p>
          </div>

          {/* Why am I seeing this? */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Why am I seeing this?</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
          </button>

          {showExplanation && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-xs text-muted-foreground leading-relaxed"
            >
              {typeExplanations[indicator.type]}
            </motion.p>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
