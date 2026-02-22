import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, MessageCircle } from 'lucide-react';
import type { ReflectionMood, ReflectionReason } from '@/types/habit';

export type ReflectionContext = 'neutral' | 'burnout' | 'momentum';

interface ReflectionInputProps {
  onSubmit: (mood: ReflectionMood, reasons: ReflectionReason[]) => void;
  currentMood?: ReflectionMood;
  currentReasons?: ReflectionReason[];
  context?: ReflectionContext;
}

const moods: { emoji: ReflectionMood; label: string }[] = [
  { emoji: '😊', label: 'Great' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😴', label: 'Tired' },
];

const reasons: { id: ReflectionReason; label: string }[] = [
  { id: 'time', label: 'Not enough time' },
  { id: 'energy', label: 'Low energy' },
  { id: 'motivation', label: 'Felt unmotivated' },
  { id: 'environment', label: 'Environment issues' },
];

// Context-aware prompts
const prompts: Record<ReflectionContext, { question: string; subtext?: string }> = {
  neutral: {
    question: 'How was today?',
    subtext: 'Optional — helps personalize your insights'
  },
  burnout: {
    question: 'How are you holding up?',
    subtext: 'No pressure — rest is productive too'
  },
  momentum: {
    question: 'What helped today?',
    subtext: "You're building something good"
  }
};

export function ReflectionInput({ 
  onSubmit, 
  currentMood, 
  currentReasons = [],
  context = 'neutral'
}: ReflectionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ReflectionMood | undefined>(currentMood);
  const [selectedReasons, setSelectedReasons] = useState<ReflectionReason[]>(currentReasons);
  const [hasSubmitted, setHasSubmitted] = useState(!!currentMood);

  const prompt = prompts[context];

  const handleMoodSelect = (mood: ReflectionMood) => {
    setSelectedMood(mood);
    // If mood is positive, submit immediately
    if (mood === '😊') {
      onSubmit(mood, []);
      setHasSubmitted(true);
      setIsExpanded(false);
      setIsOpen(false);
    } else {
      setIsExpanded(true);
    }
  };

  const toggleReason = (reason: ReflectionReason) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit(selectedMood, selectedReasons);
      setHasSubmitted(true);
      setIsExpanded(false);
      setIsOpen(false);
    }
  };

  // Collapsed state - show a gentle prompt
  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {hasSubmitted ? (
                <span className="flex items-center gap-1.5">
                  <span>{selectedMood}</span>
                  <span className="text-foreground/60">Reflection saved</span>
                </span>
              ) : (
                prompt.question
              )}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">{prompt.question}</span>
          {prompt.subtext && (
            <p className="text-xs text-muted-foreground mt-0.5">{prompt.subtext}</p>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mood Selection */}
      <div className="flex gap-2 justify-center">
        {moods.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handleMoodSelect(emoji)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
              selectedMood === emoji 
                ? 'bg-primary/20 ring-2 ring-primary scale-110' 
                : 'bg-background/50 hover:bg-background/80 hover:scale-105'
            }`}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Expandable Reasons */}
      <AnimatePresence>
        {isExpanded && selectedMood && selectedMood !== '😊' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-border/50 space-y-3">
              <span className="text-sm text-muted-foreground">What got in the way?</span>
              
              <div className="flex flex-wrap gap-2">
                {reasons.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleReason(id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedReasons.includes(id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/50 text-foreground hover:bg-background/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
