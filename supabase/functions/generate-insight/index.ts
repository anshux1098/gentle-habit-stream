import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HabitData {
  habits: Array<{ id: string; name: string; type: 'daily' | 'weekday' | 'weekend'; active: boolean }>;
  completions: Array<{ habitId: string; date: string; completed: boolean }>;
  weekdayCompletionRate: number;
  weekendCompletionRate: number;
  perfectDays: number;
  totalDays: number;
  monthlyAverage: number;
  bestDay: string;
  worstDay: string;
  inactiveHabits: string[];
}

interface RequestBody {
  type: 'weekly' | 'monthly';
  data: HabitData;
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

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'weekly') {
      systemPrompt = `You are a habit tracking assistant that provides brief, factual weekly insights.

Rules:
- Provide exactly 3 short observations (1-2 sentences each)
- Be factual and pattern-based, not motivational
- Never judge, score, or grade the user
- Never predict future performance
- Focus on observable patterns only
- Use a neutral, supportive tone

Format your response as JSON with this structure:
{
  "whatWentWell": "One sentence about positive patterns observed",
  "frictionPoint": "One sentence about an area that could use attention",
  "focusSuggestion": "One simple, concrete suggestion for next week"
}`;

      userPrompt = `Analyze this week's habit data and provide insights:
- Weekday completion rate: ${data.weekdayCompletionRate.toFixed(1)}%
- Weekend completion rate: ${data.weekendCompletionRate.toFixed(1)}%
- Perfect days this week: ${data.perfectDays}
- Active habits: ${data.habits.filter(h => h.active).map(h => h.name).join(', ') || 'None'}
- Total completions logged: ${data.completions.length}`;

    } else {
      systemPrompt = `You are a habit tracking assistant that provides brief, factual monthly insights.

Rules:
- Provide exactly 3-4 short observations (1-2 sentences each)
- Be factual and pattern-based, not motivational
- Never judge, score, or grade the user
- Never predict future performance
- Focus on observable patterns only
- Use a neutral, supportive tone

Format your response as JSON with this structure:
{
  "insights": [
    "First observation about patterns",
    "Second observation about patterns", 
    "Third observation about patterns",
    "Optional fourth observation"
  ]
}`;

      userPrompt = `Analyze this month's habit data and provide insights:
- Monthly average completion: ${data.monthlyAverage.toFixed(1)}%
- Perfect days: ${data.perfectDays} out of ${data.totalDays}
- Weekday completion rate: ${data.weekdayCompletionRate.toFixed(1)}%
- Weekend completion rate: ${data.weekendCompletionRate.toFixed(1)}%
- Best performing day: ${data.bestDay}
- Needs attention: ${data.worstDay}
- Active habits: ${data.habits.filter(h => h.active).map(h => h.name).join(', ') || 'None'}
- Habits with no completions in 30 days: ${data.inactiveHabits.join(', ') || 'None'}`;
    }

    console.log(`Generating ${type} insight for user`);

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
