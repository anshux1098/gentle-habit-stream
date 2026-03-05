import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WeeklyInsightButton } from '@/components/WeeklyInsightButton';
import { ReviewWeeklySummary } from '@/components/ReviewWeeklySummary';
import { useHabits } from '@/contexts/HabitContext';
import { useInsights } from '@/hooks/useInsights';
import { isSunday, getEffectiveDate, getDayName, getMonthName } from '@/lib/dateUtils';
import { toast } from 'sonner';

export default function ReviewPage() {
  const { 
    habits, 
    completions, 
    saveReview, 
    getCurrentReview, 
    getHabitsForDate,
    saveWeeklyInsight,
    getCurrentWeeklyInsight,
    calculateStreak,
    // Full context for AI insights
    getInsightOutcomes,
    getDailyReflections,
    getHabitEditHistory
  } = useHabits();
  
  // Pass complete context to useInsights for full AI visibility
  const { isLoadingWeekly, generateWeeklyInsight } = useInsights(
    habits, 
    completions, 
    getHabitsForDate, 
    calculateStreak,
    getInsightOutcomes(),
    getDailyReflections(),
    getHabitEditHistory()
  );
  
  const today = getEffectiveDate();
  const isSundayDay = isSunday(today);
  const existingReview = getCurrentReview();
  const existingInsight = getCurrentWeeklyInsight();

  const [whatWentWell, setWhatWentWell] = useState(existingReview?.whatWentWell || '');
  const [whatSlipped, setWhatSlipped] = useState(existingReview?.whatSlipped || '');
  const [focusNextWeek, setFocusNextWeek] = useState(existingReview?.focusNextWeek || '');
  const [isSaved, setIsSaved] = useState(!!existingReview);

  useEffect(() => {
    if (existingReview) {
      setWhatWentWell(existingReview.whatWentWell);
      setWhatSlipped(existingReview.whatSlipped);
      setFocusNextWeek(existingReview.focusNextWeek);
      setIsSaved(true);
    }
  }, [existingReview]);

  const handleSave = () => {
    saveReview({ whatWentWell, whatSlipped, focusNextWeek });
    setIsSaved(true);
    toast.success('Review saved!', { description: 'Your weekly reflection has been saved.' });
  };

  const handleGenerateInsight = async () => {
    const insight = await generateWeeklyInsight();
    if (insight) {
      saveWeeklyInsight(insight);
    }
  };

  const handleApplyInsight = (field: 'whatWentWell' | 'whatSlipped' | 'focusNextWeek', value: string) => {
    if (field === 'whatWentWell') setWhatWentWell(value);
    if (field === 'whatSlipped') setWhatSlipped(value);
    if (field === 'focusNextWeek') setFocusNextWeek(value);
    setIsSaved(false);
    toast.success('Suggestion applied!', { description: 'Feel free to edit it.' });
  };

  const hasChanges = !isSaved || 
    whatWentWell !== (existingReview?.whatWentWell || '') ||
    whatSlipped !== (existingReview?.whatSlipped || '') ||
    focusNextWeek !== (existingReview?.focusNextWeek || '');

  const [, month, day] = today.split('-');
  const dayNum = parseInt(day);

  if (!isSundayDay) {
    return (
      <Layout>
        <div className="space-y-6">
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Weekly Review</h1>
            <p className="text-muted-foreground">{getDayName(today)}, {getMonthName(today, true)} {dayNum}</p>
          </motion.header>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Come Back on Sunday</h2>
              <p className="text-muted-foreground max-w-xs">The weekly review is available on Sundays to help you reflect on your week and plan ahead.</p>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Weekly Review</h1>
            {isSaved && <CheckCircle2 className="w-5 h-5 text-success" />}
          </div>
          <p className="text-muted-foreground">Reflect on your week and set intentions for the next one</p>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl bg-accent border border-accent-foreground/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground">
            <p className="font-medium">Optional reflection</p>
            <p className="opacity-80">This doesn't affect your analytics or streaks. It's just for you.</p>
          </div>
        </motion.div>

        {/* Weekly Summary Metrics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <ReviewWeeklySummary />
        </motion.div>

        {/* AI Insight Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <WeeklyInsightButton
            existingInsight={existingInsight}
            isLoading={isLoadingWeekly}
            onGenerate={handleGenerateInsight}
            onApply={handleApplyInsight}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="went-well" className="text-base font-medium">✨ What went well this week?</Label>
            <Textarea id="went-well" value={whatWentWell} onChange={(e) => { setWhatWentWell(e.target.value); setIsSaved(false); }} placeholder="Celebrate your wins, big or small..." className="min-h-[100px] bg-card" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slipped" className="text-base font-medium">🔄 What slipped?</Label>
            <Textarea id="slipped" value={whatSlipped} onChange={(e) => { setWhatSlipped(e.target.value); setIsSaved(false); }} placeholder="What habits or goals need more attention..." className="min-h-[100px] bg-card" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="focus" className="text-base font-medium">🎯 One focus for next week</Label>
            <Textarea id="focus" value={focusNextWeek} onChange={(e) => { setFocusNextWeek(e.target.value); setIsSaved(false); }} placeholder="What's your main intention for the coming week..." className="min-h-[80px] bg-card" />
          </div>
          <Button onClick={handleSave} disabled={!hasChanges} className="w-full" size="lg">
            {isSaved ? 'Saved' : 'Save Review'}
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center py-4">
          <p className="text-sm text-muted-foreground">🌱 Progress over perfection. Every small step counts.</p>
        </motion.div>
      </div>
    </Layout>
  );
}
