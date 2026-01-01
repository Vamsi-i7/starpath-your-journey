import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "habit_suggestions":
        systemPrompt = `You are a productivity coach specializing in habit formation for students. Based on the user's current habits and goals, suggest 3-5 new habits that would complement their routine. Be specific, actionable, and consider their existing workload. Format each suggestion with an emoji, title, and brief description.`;
        userPrompt = `Current habits: ${context.habits || "None yet"}
Goals: ${context.goals || "General productivity"}
Level: ${context.level || 1}
Please suggest complementary habits that would help achieve these goals.`;
        break;

      case "daily_affirmation":
        systemPrompt = `You are an encouraging AI mentor for students. Generate a personalized, motivating affirmation based on the user's progress. Keep it concise (2-3 sentences), warm, and empowering. Include a small actionable tip.`;
        userPrompt = `User stats:
- XP: ${context.xp || 0}
- Level: ${context.level || 1}
- Habits completed today: ${context.completedToday || 0}
- Current streak: ${context.streak || 0}
- Username: ${context.username || "Student"}
Generate a personalized morning affirmation and tip.`;
        break;

      case "coach_chat":
        systemPrompt = `You are StarPath Coach, a friendly and supportive AI mentor for students. You help with:
- Motivation and accountability
- Study tips and productivity advice
- Habit formation guidance
- Goal setting strategies
Keep responses concise, encouraging, and actionable. Use emojis sparingly. Never provide medical, legal, or financial advice.`;
        userPrompt = context.message || "Hello!";
        break;

      default:
        throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: type === "coach_chat",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    if (type === "coach_chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI coach error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
