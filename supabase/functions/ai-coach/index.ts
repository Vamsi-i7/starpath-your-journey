import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenRouter API endpoint (FREE models)
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// FREE Models from OpenRouter - ordered by preference
const FREE_MODELS = {
  primary: "google/gemini-2.0-flash-exp:free",      // Best quality
  secondary: "nvidia/nemotron-nano-12b-v2-vl:free", // Good backup
  fallback: "xiaomi/mimo-v2-flash:free",            // Last resort
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    
    // Use FREE OpenRouter API
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured. Add your OpenRouter API key to Supabase secrets.");
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

    // Build messages array for OpenRouter (OpenAI-compatible format)
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // For streaming chat responses
    if (type === "coach_chat") {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://starpath.app",
          "X-Title": "StarPath AI Mentor",
        },
        body: JSON.stringify({
          model: FREE_MODELS.primary,
          messages: messages,
          temperature: 0.8,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter streaming error:", response.status, errorText);
        throw new Error("AI streaming failed");
      }

      // Pass through the SSE stream (OpenRouter uses OpenAI-compatible format)
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        },
      });
    }

    // Non-streaming requests - try models with fallback
    let content = "";
    let lastError = null;
    const modelsToTry = [FREE_MODELS.primary, FREE_MODELS.secondary, FREE_MODELS.fallback];
    
    for (const model of modelsToTry) {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://starpath.app",
            "X-Title": "StarPath AI Mentor",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.8,
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${model} error:`, response.status, errorText);
          
          if (response.status === 429) {
            lastError = "Rate limit exceeded. Please try again in a minute.";
            continue;
          }
          
          lastError = `Model ${model} failed`;
          continue;
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "";
        
        if (content) break; // Success
      } catch (e) {
        console.error(`Error with ${model}:`, e);
        lastError = e.message;
        continue;
      }
    }

    if (!content) {
      throw new Error(lastError || "All AI models failed. Please try again later.");
    }

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
