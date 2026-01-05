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
    const { type, prompt, context, fileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    switch (type) {
      case "notes":
        systemPrompt = `You are an expert note-taking assistant for students. Generate comprehensive, well-structured study notes based on the topic provided. Include:
- Key concepts and definitions
- Important points with bullet points
- Summary at the end
Format the response in markdown.`;
        break;
        
      case "notes_from_file":
        systemPrompt = `You are an expert note-taking assistant. Analyze the provided document/image and generate comprehensive, well-structured study notes. Include:
- Key concepts and definitions extracted from the content
- Important points with bullet points
- Main ideas and supporting details
- Summary at the end
Format the response in markdown. Be thorough and extract all relevant information.`;
        break;
        
      case "flashcards":
        systemPrompt = `You are an expert flashcard creator for students. Generate 10 flashcards based on the topic provided. Return a JSON array with objects containing "question" and "answer" fields. Only return the JSON array, no other text.`;
        break;
        
      case "flashcards_from_file":
        systemPrompt = `You are an expert flashcard creator. Analyze the provided document/image and generate 10-15 flashcards based on the content. Return a JSON array with objects containing "question" and "answer" fields. Only return the JSON array, no other text. Make sure to cover all key concepts from the document.`;
        break;
        
      case "roadmap":
        systemPrompt = `You are an expert learning roadmap creator. Generate a detailed learning roadmap for the topic provided. Include:
- Timeline (weeks/months)
- Milestones and checkpoints
- Resources to use
- Skills to acquire at each stage
Format the response in markdown with clear sections.`;
        break;
        
      case "roadmap_from_file":
        systemPrompt = `You are an expert learning roadmap creator. Analyze the provided document/image and create a learning roadmap based on the content. Include:
- Timeline (weeks/months) to master the content
- Milestones and checkpoints
- Related resources to explore
- Skills and concepts to acquire at each stage
Format the response in markdown with clear sections.`;
        break;
        
      case "mentor":
        systemPrompt = `You are an AI mentor and tutor for students. Answer questions clearly and helpfully. Provide explanations, examples, and guide the student to understand concepts deeply. Be encouraging and supportive.`;
        break;
        
      case "habit_suggestion":
        systemPrompt = `You are a habit coach. Based on the user's goals and current habits, suggest 3-5 new habits that would help them achieve their goals. Return a JSON array with objects containing "name", "description", "frequency" (daily/weekly), and "reason" fields. Only return the JSON array.`;
        break;
        
      case "affirmation":
        systemPrompt = `You are a motivational coach. Generate a personalized daily affirmation and insight based on the user's progress. Be encouraging, specific, and actionable. Keep it under 100 words.`;
        break;
        
      case "coach":
        systemPrompt = `You are an AI life coach focused on productivity and habit formation. Provide motivation, tips, and guidance based on the user's progress. Be supportive, practical, and encouraging.`;
        break;
        
      default:
        throw new Error("Invalid generation type");
    }

    // Build messages array
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Handle file content for multimodal requests
    if (fileData && (type.includes('_from_file'))) {
      const { base64, mimeType, fileName } = JSON.parse(fileData);
      
      // Use multimodal message format for Gemini
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt || `Please analyze this ${fileName} and generate content based on it.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: context ? `${prompt}\n\nContext: ${context}` : prompt
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI generate error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
