import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreFlight } from "../_shared/corsHeaders.ts";
import { checkRateLimit, addRateLimitHeaders, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { verifyAuth, createUnauthorizedResponse } from "../_shared/auth.ts";
import { validateRequest, aiGenerateSchema, createValidationErrorResponse } from "../_shared/validation.ts";

// OpenRouter API endpoint (FREE models)
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// FREE Models from OpenRouter - Optimized for each task
const FREE_MODELS = {
  // Text understanding & reasoning
  reasoning: "deepseek/deepseek-r1-0528:free",      // Best reasoning (163K context)
  // Math & structured output
  structured: "qwen/qwen3-coder:free",               // Math & code (262K context)
  // Creative & speed
  creative: "mistralai/devstral-2512:free",          // Creative tasks (262K context)
  // Fast responses
  fast: "xiaomi/mimo-v2-flash:free",                 // Speed (262K context)
};

// Model capabilities and optimal use cases
const MODEL_CAPABILITIES = {
  "deepseek/deepseek-r1-0528:free": {
    maxTokens: 163840,
    bestFor: ["notes", "quiz", "essay_check", "language_practice"],
  },
  "qwen/qwen3-coder:free": {
    maxTokens: 262000,
    bestFor: ["math_solve", "flashcards", "roadmap"],
  },
  "mistralai/devstral-2512:free": {
    maxTokens: 262144,
    bestFor: ["mindmap", "summary"],
  },
  "xiaomi/mimo-v2-flash:free": {
    maxTokens: 262144,
    bestFor: ["summary"], // Fallback for speed
  },
};

// Select best model for AI tool type
function selectModelForType(type: string): string[] {
  const modelPriority: Record<string, string[]> = {
    notes: [FREE_MODELS.reasoning, FREE_MODELS.structured, FREE_MODELS.creative],
    summary: [FREE_MODELS.fast, FREE_MODELS.creative, FREE_MODELS.reasoning],
    flashcards: [FREE_MODELS.structured, FREE_MODELS.creative, FREE_MODELS.reasoning],
    quiz: [FREE_MODELS.reasoning, FREE_MODELS.structured, FREE_MODELS.creative],
    essay_check: [FREE_MODELS.reasoning, FREE_MODELS.creative, FREE_MODELS.structured],
    math_solve: [FREE_MODELS.structured, FREE_MODELS.reasoning, FREE_MODELS.creative],
    language_practice: [FREE_MODELS.reasoning, FREE_MODELS.fast, FREE_MODELS.structured],
    roadmap: [FREE_MODELS.structured, FREE_MODELS.creative, FREE_MODELS.reasoning],
    mindmap: [FREE_MODELS.creative, FREE_MODELS.structured, FREE_MODELS.reasoning],
  };

  return modelPriority[type] || [FREE_MODELS.reasoning, FREE_MODELS.structured, FREE_MODELS.creative];
}

// Rate limit configuration: 10 requests per minute per user
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: "AI generation rate limit exceeded. Please wait before making more requests.",
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight(req);
  }

  try {
    // 1. Verify authentication
    const { userId, error: authError } = await verifyAuth(req);
    if (authError || !userId) {
      return createUnauthorizedResponse(authError || "Authentication required", corsHeaders);
    }

    // 2. Check rate limit
    const rateLimitResult = checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.error || "Rate limit exceeded",
        rateLimitResult.resetTime,
        corsHeaders
      );
    }

    // 3. Validate request
    const { data: validatedData, error: validationError, details } = await validateRequest(
      req,
      aiGenerateSchema
    );

    if (validationError || !validatedData) {
      return createValidationErrorResponse(
        validationError || "Invalid request",
        details,
        corsHeaders
      );
    }

    const { type, prompt, context, fileData } = validatedData;
    
    // Use FREE OpenRouter API
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured. Add your OpenRouter API key to Supabase secrets.");
    }
    
    // Select optimal models for this AI tool type
    const selectedModels = selectModelForType(type);

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

      case "quiz":
        systemPrompt = `You are an expert quiz creator for students. Generate a quiz with 10 multiple choice questions about the topic: ${prompt}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Make questions progressively harder. Ensure correctAnswer is the index (0-3) of the correct option.`;
        break;

      case "essay":
        systemPrompt = `You are an expert essay analyzer and writing coach. Analyze the following essay and provide detailed feedback.

Essay to analyze:
${prompt}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "overallScore": 85,
  "grammar": {
    "score": 90,
    "issues": [
      {
        "line": 1,
        "text": "problematic text",
        "suggestion": "corrected text",
        "type": "grammar"
      }
    ]
  },
  "structure": {
    "score": 80,
    "feedback": "Detailed feedback on essay structure"
  },
  "clarity": {
    "score": 85,
    "feedback": "Feedback on clarity and coherence"
  },
  "tone": "Academic",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "strengths": ["Strength 1", "Strength 2"],
  "wordCount": 500,
  "sentenceCount": 25,
  "paragraphCount": 5
}

Be constructive and helpful. Issue types can be: grammar, spelling, punctuation, style.`;
        break;

      case "math":
        systemPrompt = `You are an expert math tutor. Solve this math problem step by step: ${prompt}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "problem": "${prompt}",
  "steps": [
    {
      "step": 1,
      "description": "What we're doing in this step",
      "equation": "The mathematical expression",
      "explanation": "Why we're doing this"
    }
  ],
  "finalAnswer": "x = 5",
  "verification": "Verification showing the answer is correct"
}

Show all steps clearly. Include verification by substituting the answer back.`;
        break;

      case "mindmap":
        systemPrompt = `You are an expert mind map creator. Create a hierarchical mind map for the topic: ${prompt}

Return the mind map in markdown format using headers and bullet points:
# Central Topic

## Main Branch 1
- Sub-point 1.1
- Sub-point 1.2
  - Detail 1.2.1

## Main Branch 2
- Sub-point 2.1
- Sub-point 2.2

Create 4-6 main branches with 2-4 sub-points each. Make it comprehensive but organized.`;
        break;

      case "summary":
        systemPrompt = `You are an expert text summarizer. Summarize the following text:

${prompt}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "summary": {
    "short": "1-2 sentence summary",
    "medium": "One paragraph summary with key details",
    "long": "Detailed multi-paragraph summary"
  },
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "originalWordCount": 1500,
  "summaryWordCount": {
    "short": 30,
    "medium": 100,
    "long": 250
  }
}

Calculate actual word counts. Extract 5-7 key points.`;
        break;

      case "language":
        const targetLanguage = context || "Spanish";
        systemPrompt = `You are a friendly ${targetLanguage} language practice partner. The user wants to practice ${targetLanguage}.

User message: ${prompt}

Respond naturally in ${targetLanguage}, then provide helpful feedback.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "aiResponse": "Your response in ${targetLanguage}",
  "corrections": [
    {
      "userText": "What user wrote (if any errors)",
      "corrected": "Corrected version",
      "feedback": "Explanation of the correction",
      "alternativePhrases": ["Alternative 1", "Alternative 2"]
    }
  ],
  "vocabulary": [
    {
      "word": "New word from your response",
      "meaning": "English meaning",
      "example": "Example sentence"
    }
  ]
}

If user wrote correctly, set corrections to empty array. Always include 1-3 vocabulary words from your response.`;
        break;
        
      default:
        throw new Error("Invalid generation type");
    }

    // Build messages array for OpenRouter (OpenAI-compatible format)
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Handle file content for multimodal requests
    if (hasImage) {
      const { base64, mimeType, fileName } = JSON.parse(fileData);
      
      // Check if model supports this mime type
      const modelCaps = MODEL_CAPABILITIES[selectedModel as keyof typeof MODEL_CAPABILITIES];
      if (!modelCaps?.supportedMimes.includes(mimeType)) {
        // Try secondary model
        selectedModel = FREE_MODELS.secondary;
      }
      
      // Build multimodal message with image
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
      // Text-only request
      const userMessage = context ? `${prompt}\n\nContext: ${context}` : prompt;
      messages.push({
        role: "user",
        content: userMessage
      });
    }

    // Try optimized models in order (all FREE)
    let result = "";
    let lastError = null;
    const modelsToTry = selectedModels;
    
    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://starpath.app",
            "X-Title": "StarPath AI Tools",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096, // Reasonable limit for all models
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${model} error:`, response.status, errorText);
          
          if (response.status === 429) {
            lastError = "Rate limit exceeded. Please try again in a minute.";
            continue; // Try next model
          }
          if (response.status === 402) {
            lastError = "API quota exceeded.";
            continue;
          }
          
          lastError = `Model ${model} failed`;
          continue; // Try next model
        }

        const data = await response.json();
        result = data.choices?.[0]?.message?.content || "";
        
        if (result) {
          console.log(`Success with model: ${model}`);
          break; // Success, exit loop
        }
      } catch (e) {
        console.error(`Error with ${model}:`, e);
        lastError = e.message;
        continue; // Try next model
      }
    }

    if (!result) {
      throw new Error(lastError || "All AI models failed. Please try again later.");
    }

    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, "Content-Type": "application/json" },
      rateLimitResult
    );

    return new Response(JSON.stringify({ result }), {
      headers: responseHeaders,
    });
  } catch (error) {
    // Log error without exposing sensitive details
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    // Don't expose internal errors to client
    const publicMessage = errorMessage.includes("OPENROUTER_API_KEY")
      ? "AI service configuration error. Please contact support."
      : errorMessage.includes("quota") || errorMessage.includes("rate limit")
      ? "AI service temporarily unavailable. Please try again later."
      : "Failed to generate AI content. Please try again.";

    return new Response(
      JSON.stringify({ 
        error: publicMessage,
        retryable: !errorMessage.includes("configuration")
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
