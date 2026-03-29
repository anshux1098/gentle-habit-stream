import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/contexts/HabitContext';

const ONBOARDING_KEY = 'habit-flow-onboarded';

const HABIT_TEMPLATES = [
  'Morning walk',
  'Read 30 mins',
  'Drink 8 glasses of water',
  'No phone before 9am',
  'Sleep by 11pm',
  '10 mins meditation',
];

interface Props {
  hasHabits: boolean;
  onAddFirstHabit: () => void;
}

/**
 * First-launch detection: shown once, never again after dismissed or habits exist.
 * Stored in localStorage under ONBOARDING_KEY.
 */
export function OnboardingModal({ hasHabits, onAddFirstHabit }: Props) {
  const { addHabit } = useHabits();
  const [visible, setVisible] = useState(false);
  const [addedTemplates, setAddedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show only if user has never seen it AND has no habits
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen && !hasHabits) {
      setVisible(true);
    }
  }, [hasHabits]);

  // Once the user adds their first habit, quietly close
  useEffect(() => {
    if (hasHabits && visible) {
      dismiss();
    }
  }, [hasHabits]);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
  };

  const handleCTA = () => {
    dismiss();
    onAddFirstHabit();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 bottom-24 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[380px]"
          >
            <div className="relative rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
              {/* Subtle accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              <div className="p-6 space-y-5">
                {/* Dismiss */}
                <button
                  onClick={dismiss}
                  aria-label="Dismiss"
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Headline */}
                <div className="space-y-1 pr-4">
                  <h2 className="text-lg font-semibold text-foreground leading-snug">
                    Build habits that actually stick.
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Track what you care about. The app watches for patterns — quietly, without pressure.
                  </p>
                </div>

                {/* Feature hints */}
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Momentum tracking</p>
                      <p className="text-xs text-muted-foreground">Get a quiet nudge when you're on a roll or bouncing back.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Burnout detection</p>
                      <p className="text-xs text-muted-foreground">The app notices when you're overloaded — before you do.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Streaks that matter</p>
                      <p className="text-xs text-muted-foreground">Only counts days the habit was actually scheduled.</p>
                    </div>
                  </li>
                </ul>

                {/* Habit Templates */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick start — tap to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_TEMPLATES.map((template) => {
                      const isAdded = addedTemplates.has(template);
                      return (
                        <button
                          key={template}
                          disabled={isAdded}
                          onClick={() => {
                            addHabit(template, 'daily', undefined, 'strict');
                            setAddedTemplates((prev) => new Set(prev).add(template));
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            isAdded
                              ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
                              : 'bg-muted border-border text-foreground hover:bg-accent hover:border-accent-foreground/20'
                          }`}
                        >
                          {isAdded && <Check className="w-3 h-3" />}
                          {template}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <Button onClick={handleCTA} className="w-full" size="lg">
                  Add your first habit
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  No account needed. Everything stays on your device.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Post-first-habit tooltip shown once after the first habit is added.
 * Points to Focus Habit and briefly explains streaks.
 */
const POST_ONBOARD_KEY = 'habit-flow-post-onboard';

interface PostOnboardingProps {
  hasHabits: boolean;
}

export function PostOnboardingHint({ hasHabits }: PostOnboardingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasHabits) return;
    const mainSeen = localStorage.getItem(ONBOARDING_KEY);
    const postSeen = localStorage.getItem(POST_ONBOARD_KEY);
    // Show only after main onboarding was dismissed and post-hint hasn't been shown yet
    if (mainSeen && !postSeen) {
      // Small delay so it doesn't appear simultaneously with the habit being added
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [hasHabits]);

  const dismiss = () => {
    localStorage.setItem(POST_ONBOARD_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="post-hint"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss tip"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <p className="text-sm font-medium text-foreground pr-5">
            💡 Tip: Pin a Focus Habit
          </p>
          <p className="text-xs text-muted-foreground">
            Tap the star on any habit to mark it as today's priority. Streaks only count scheduled days — so missing a rest day never breaks your streak.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
