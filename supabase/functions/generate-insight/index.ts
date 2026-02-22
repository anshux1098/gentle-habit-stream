import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HabitInfo {
  id: string;
  name: string;
  type: 'daily' | 'weekday' | 'weekend';
  active: boolean;
  ageInDays: number;
  currentStreak: number;
  completionRate: number;
}

// Reflection mood types
type ReflectionMood = '😊' | '😐' | '😔' | '😤' | '😴';
type ReflectionReason = 'time' | 'energy' | 'motivation' | 'environment' | 'other';

interface DailyReflection {
  date: string;
  mood?: ReflectionMood;
  reasons?: ReflectionReason[];
  createdAt: string;
}

interface HabitData {
  habits: HabitInfo[];
  completions: Array<{ habitId: string; date: string; completed: boolean }>;
  weekdayCompletionRate: number;
  weekendCompletionRate: number;
  perfectDays: number;
  totalDays: number;
  monthlyAverage: number;
  bestDay: string;
  worstDay: string;
  inactiveHabits: string[];
  // Enhanced context
  userProfile: 'beginner' | 'consistent' | 'struggling';
  totalHabitCount: number;
  habitsAddedThisMonth: number;
  averageHabitAge: number;
  longestStreak: number;
  dropOffPatterns: Array<{ habitName: string; dropOffDay: number }>;
  hasInsufficientData: boolean;
  daysTracked: number;
  // Advanced context for adaptive insights
  insightAdaptation: 'simplified' | 'standard' | 'advanced';
  recentReflections: DailyReflection[];
  burnoutSignals: { type: string; count: number }[];
  momentumMetrics: { recoverySpeed: number; consistencyScore: number };
}

interface RequestBody {
  type: 'weekly' | 'monthly';
  data: HabitData;
}

function getBaseSystemPrompt(userProfile: string, hasInsufficientData: boolean): string {
  let toneGuidance = '';
  
  switch (userProfile) {
    case 'beginner':
      toneGuidance = `
The user is a BEGINNER (new to habit tracking or has few habits).
- Be encouraging and clear
- Focus on establishing foundations
- Celebrate any progress, no matter how small
- Keep recommendations simple and achievable`;
      break;
    case 'consistent':
      toneGuidance = `
The user is CONSISTENT (good completion rates, established routines).
- Focus on optimization and reflection
- Suggest refinements, not overhauls
- Acknowledge their discipline
- Offer insights for maintaining momentum`;
      break;
    case 'struggling':
      toneGuidance = `
The user is STRUGGLING (low completion rates or broken streaks).
- Focus on simplification and reassurance
- Never blame or judge
- Suggest reducing scope if needed
- Emphasize that any progress counts
- Be warm and supportive`;
      break;
  }

  const insufficientDataNote = hasInsufficientData ? `
IMPORTANT: The user has LIMITED DATA (less than 7 days tracked).
- Clearly acknowledge this in your insights
- Focus on habit setup quality, not performance
- Avoid drawing conclusions from incomplete data
- Be encouraging about the early stage` : '';

  return `You are a calm, supportive habit tracking assistant. Your role is to provide helpful, factual insights.

${toneGuidance}
${insufficientDataNote}

CORE RULES:
1. Every insight must include:
   a) One clear OBSERVATION (data-based, specific)
   b) One POSITIVE REINFORCEMENT (genuine, not generic)
   c) One ACTIONABLE RECOMMENDATION (simple, optional to follow)

2. NEVER:
   - Use generic motivational clichés ("You've got this!", "Keep pushing!")
   - Judge, score, or grade the user
   - Predict future performance
   - Make the user feel bad about gaps
   - Hallucinate progress that doesn't exist

3. ALWAYS:
   - Be factual and pattern-based
   - Use a calm, practical tone
   - Make recommendations optional ("You might consider...")
   - Acknowledge the user's autonomy
   - Be specific about what you observe`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const basePrompt = getBaseSystemPrompt(data.userProfile || 'beginner', data.hasInsufficientData || false);
    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'weekly') {
      systemPrompt = `${basePrompt}

FORMAT: Return valid JSON with this exact structure:
{
  "whatWentWell": "One specific observation about positive patterns this week",
  "frictionPoint": "One specific area that could use attention (be kind)",
  "focusSuggestion": "One simple, concrete suggestion for next week",
  "keyPhrases": ["phrase1", "phrase2"] // 2-3 key phrases to highlight
}`;

      // Build context-aware prompt
      const habitDetails = data.habits
        .filter(h => h.active)
        .map(h => `- ${h.name}: ${h.ageInDays} days old, ${h.currentStreak}-day streak, ${h.completionRate.toFixed(0)}% completion`)
        .join('\n');

      const dropOffInfo = data.dropOffPatterns.length > 0
        ? `\nDrop-off patterns detected:\n${data.dropOffPatterns.map(d => `- ${d.habitName}: tends to drop after day ${d.dropOffDay}`).join('\n')}`
        : '';

      // Build reflection context if available
      const reflections = data.recentReflections || [];
      const reflectionContext = reflections.length > 0
        ? `\nRECENT REFLECTIONS (user-reported):\n${reflections.map(r => {
            const moodText = r.mood || 'not specified';
            const reasonsText = r.reasons?.length ? r.reasons.join(', ') : 'none specified';
            return `- ${r.date}: mood ${moodText}, challenges: ${reasonsText}`;
          }).join('\n')}`
        : '';

      // Build burnout signal context
      const burnoutSignals = data.burnoutSignals || [];
      const burnoutContext = burnoutSignals.length > 0
        ? `\nENERGY SIGNALS:\n${burnoutSignals.map(s => `- ${s.type}: detected ${s.count} time(s)`).join('\n')}`
        : '';

      // Build momentum context
      const momentum = data.momentumMetrics || { recoverySpeed: 0, consistencyScore: 0 };
      const momentumContext = `\nMOMENTUM METRICS:
- Recovery speed (after missed days): ${momentum.recoverySpeed.toFixed(1)}%
- Consistency score: ${momentum.consistencyScore.toFixed(1)}%`;

      // Insight adaptation level affects recommendation complexity
      const adaptationNote = data.insightAdaptation === 'simplified' 
        ? '\nNote: Keep recommendations VERY simple - user tends to skip complex suggestions.'
        : data.insightAdaptation === 'advanced'
        ? '\nNote: User follows recommendations well - can suggest slightly more nuanced improvements.'
        : '';

      userPrompt = `Analyze this week's habit data:

COMPLETION RATES:
- Weekday average: ${data.weekdayCompletionRate.toFixed(1)}%
- Weekend average: ${data.weekendCompletionRate.toFixed(1)}%
- Perfect days this week: ${data.perfectDays}
- Days tracked so far: ${data.daysTracked || data.totalDays}

HABIT DETAILS:
${habitDetails || 'No active habits yet'}
${dropOffInfo}

USER CONTEXT:
- Profile: ${data.userProfile}
- Total habits: ${data.totalHabitCount}
- Longest streak: ${data.longestStreak}
- Insight adaptation: ${data.insightAdaptation || 'standard'}
${data.hasInsufficientData ? '- Note: Limited data available (early stage)' : ''}
${momentumContext}
${reflectionContext}
${burnoutContext}
${adaptationNote}

Provide weekly insights based on this data.`;

    } else {
      // Monthly insights
      systemPrompt = `${basePrompt}

MONTHLY ANALYSIS FOCUS:
- Detect habit fatigue (declining completion over time)
- Identify over-ambition (too many habits added quickly)
- Notice silent consistency (high success, regular patterns)
- Look for weekday vs weekend imbalances

FORMAT: Return valid JSON with this exact structure:
{
  "insights": [
    {
      "type": "observation",
      "text": "Specific data-based observation",
      "highlight": "key phrase to emphasize"
    },
    {
      "type": "positive",
      "text": "Genuine positive reinforcement",
      "highlight": "key phrase to emphasize"
    },
    {
      "type": "recommendation",
      "text": "Optional, actionable suggestion",
      "highlight": "key phrase to emphasize"
    }
  ],
  "overallTone": "encouraging" | "reflective" | "supportive"
}`;

      const habitConsistency = data.habits
        .filter(h => h.active)
        .map(h => `- ${h.name}: ${h.completionRate.toFixed(0)}% consistent`)
        .join('\n');

      const fatigueWarning = data.habitsAddedThisMonth > 3 
        ? `\nPotential over-ambition: ${data.habitsAddedThisMonth} habits added this month.` 
        : '';

      // Build reflection context for monthly view
      const reflections = data.recentReflections || [];
      const monthlyReflectionContext = reflections.length > 0
        ? `\nUSER REFLECTIONS THIS MONTH:\n${reflections.slice(0, 10).map(r => {
            const moodText = r.mood || 'not specified';
            const reasonsText = r.reasons?.length ? r.reasons.join(', ') : 'none specified';
            return `- ${r.date}: mood ${moodText}, challenges: ${reasonsText}`;
          }).join('\n')}`
        : '';

      // Build burnout signal context
      const burnoutSignals = data.burnoutSignals || [];
      const monthlyBurnoutContext = burnoutSignals.length > 0
        ? `\nENERGY SIGNALS DETECTED:\n${burnoutSignals.map(s => `- ${s.type}: occurred ${s.count} time(s)`).join('\n')}`
        : '';

      // Build momentum context
      const momentum = data.momentumMetrics || { recoverySpeed: 0, consistencyScore: 0 };
      const monthlyMomentumContext = `\nMOMENTUM ANALYSIS:
- Recovery speed (how quickly user bounces back): ${momentum.recoverySpeed.toFixed(1)}%
- Consistency score (sustained completions): ${momentum.consistencyScore.toFixed(1)}%`;

      // Insight adaptation level
      const adaptationNote = data.insightAdaptation === 'simplified' 
        ? '\nNote: Keep recommendations VERY simple - user tends to skip complex suggestions.'
        : data.insightAdaptation === 'advanced'
        ? '\nNote: User follows recommendations well - can suggest slightly more nuanced improvements.'
        : '';

      userPrompt = `Analyze this month's habit data:

MONTHLY OVERVIEW:
- Average completion: ${data.monthlyAverage.toFixed(1)}%
- Perfect days: ${data.perfectDays} out of ${data.totalDays} days
- Best performing day: ${data.bestDay}
- Lowest performing day: ${data.worstDay}

WEEKDAY VS WEEKEND:
- Weekday rate: ${data.weekdayCompletionRate.toFixed(1)}%
- Weekend rate: ${data.weekendCompletionRate.toFixed(1)}%

HABIT CONSISTENCY:
${habitConsistency || 'No active habits'}

CONTEXT:
- Average habit age: ${data.averageHabitAge.toFixed(0)} days
- Habits with no activity (30+ days): ${data.inactiveHabits.join(', ') || 'None'}
- User profile: ${data.userProfile}
- Insight adaptation: ${data.insightAdaptation || 'standard'}
${fatigueWarning}
${data.hasInsufficientData ? '- Limited data: Only ' + data.daysTracked + ' days tracked' : ''}
${monthlyMomentumContext}
${monthlyReflectionContext}
${monthlyBurnoutContext}
${adaptationNote}

Provide monthly insights focusing on patterns, not judgment.`;
    }

    console.log(`Generating ${type} insight for ${data.userProfile} user`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insight" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsedInsight;
    try {
      parsedInsight = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    console.log(`Successfully generated ${type} insight`);

    return new Response(
      JSON.stringify({ success: true, insight: parsedInsight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating insight:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
