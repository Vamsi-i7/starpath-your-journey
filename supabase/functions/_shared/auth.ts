/**
 * Authentication utilities for Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

/**
 * Verify JWT token and get user
 */
export async function verifyAuth(request: Request): Promise<{
  userId: string;
  user: any;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return {
      userId: '',
      user: null,
      error: 'Missing authorization header',
    };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        userId: '',
        user: null,
        error: 'Invalid or expired token',
      };
    }

    return {
      userId: user.id,
      user,
    };
  } catch (error) {
    return {
      userId: '',
      user: null,
      error: 'Authentication failed',
    };
  }
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
