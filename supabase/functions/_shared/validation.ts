/**
 * Validation schemas using Zod for Edge Functions
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// AI Generate Request Schema
export const aiGenerateSchema = z.object({
  type: z.enum([
    'notes',
    'summary',
    'flashcards',
    'quiz',
    'essay_check',
    'math_solve',
    'language_practice',
    'roadmap',
    'mindmap'
  ]),
  prompt: z.string().min(1).max(10000),
  context: z.record(z.any()).optional(),
  fileData: z.object({
    content: z.string().max(100000), // 100KB limit
    fileName: z.string().max(255),
    fileType: z.string().max(100),
  }).optional(),
  options: z.object({
    language: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    numQuestions: z.number().min(1).max(50).optional(),
    tone: z.string().optional(),
  }).optional(),
});

// AI Coach Request Schema
export const aiCoachSchema = z.object({
  type: z.enum(['affirmation', 'motivation', 'advice', 'chat']),
  message: z.string().min(1).max(5000).optional(),
  context: z.object({
    level: z.number().min(1).max(100).optional(),
    xp: z.number().min(0).optional(),
    streak: z.number().min(0).optional(),
    habits: z.array(z.any()).optional(),
    goals: z.array(z.any()).optional(),
  }).optional(),
});

// Razorpay Order Schema
export const razorpayOrderSchema = z.object({
  amount: z.number().min(1).max(100000000), // Max 1 crore rupees
  currency: z.string().length(3).default('INR'),
  planType: z.enum(['monthly', 'yearly', 'lifetime']).optional(),
  userId: z.string().uuid().optional(),
});

// Razorpay Payment Verification Schema
export const razorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan_type: z.enum(['monthly', 'yearly', 'lifetime']),
});

// Razorpay Subscription Schema
export const razorpaySubscriptionSchema = z.object({
  plan_id: z.string().min(1),
  customer_notify: z.number().min(0).max(1).default(1),
  total_count: z.number().min(1).max(100),
  notes: z.record(z.string()).optional(),
});

// User Delete Schema
export const userDeleteSchema = z.object({
  userId: z.string().uuid(),
  confirmText: z.string().refine(
    (val) => val === 'DELETE MY ACCOUNT',
    { message: 'Confirmation text must match exactly' }
  ).optional(),
});

// Credit Transaction Schema
export const creditTransactionSchema = z.object({
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(500),
  operation: z.enum(['add', 'deduct']),
});

/**
 * Validate request body against a schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: string; details?: any }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      };
    }

    return { data: result.data };
  } catch (error) {
    return {
      error: 'Invalid JSON in request body',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  error: string,
  details: any,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: error,
      details,
    }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}
