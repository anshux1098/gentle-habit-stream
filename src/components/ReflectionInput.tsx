import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import type { ReflectionMood, ReflectionReason } from '@/types/habit';

interface ReflectionInputProps {
  onSubmit: (mood: ReflectionMood, reasons: ReflectionReason[]) => void;
  currentMood?: ReflectionMood;
  currentReasons?: ReflectionReason[];
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

export function ReflectionInput({ onSubmit, currentMood, currentReasons = [] }: ReflectionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ReflectionMood | undefined>(currentMood);
  const [selectedReasons, setSelectedReasons] = useState<ReflectionReason[]>(currentReasons);

  const handleMoodSelect = (mood: ReflectionMood) => {
    setSelectedMood(mood);
    // If mood is positive, don't show reasons
    if (mood === '😊') {
      onSubmit(mood, []);
      setIsExpanded(false);
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
      setIsExpanded(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mood Selection */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">How was today?</span>
        <div className="flex gap-2">
          {moods.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => handleMoodSelect(emoji)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                selectedMood === emoji 
                  ? 'bg-primary/20 ring-2 ring-primary scale-110' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
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
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">What got in the way?</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {reasons.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleReason(id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedReasons.includes(id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
