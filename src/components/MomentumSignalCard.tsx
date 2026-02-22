import { motion } from 'framer-motion';
import { TrendingUp, Zap, Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { MomentumSignal } from '@/types/habit';

interface MomentumSignalCardProps {
  signal: MomentumSignal;
}

const iconMap = {
  recovery: TrendingUp,
  consistency: Zap,
  identity_shift: Sparkles,
};

const colorMap = {
  recovery: 'text-success',
  consistency: 'text-primary',
  identity_shift: 'text-warning',
};

const explanationMap = {
  recovery: "This highlights how quickly you bounced back after missing a day. Recovery speed is a key indicator of habit strength.",
  consistency: "Sustained consistency means showing up regularly over time, even without perfect streaks. It's about the overall pattern.",
  identity_shift: "When you consistently act a certain way, you start becoming that person. Your habits are shaping who you are.",
};

export function MomentumSignalCard({ signal }: MomentumSignalCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const Icon = iconMap[signal.type];
  const color = colorMap[signal.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-muted/30 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            {signal.message}
          </p>
          
          {signal.habitName && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-muted/30 text-xs text-muted-foreground">
              {signal.habitName}
            </span>
          )}

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
              {explanationMap[signal.type]}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
