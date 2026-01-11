// Edge function to check if a user exists by email
// Returns boolean without exposing sensitive data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get email from request
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ 
          exists: false, 
          error: 'Email is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user exists in auth.users table
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error checking user existence:', error)
      return new Response(
        JSON.stringify({ 
          exists: false,
          error: 'Unable to verify email'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Find user by normalized email
    const userExists = users.users.some(
      user => user.email?.toLowerCase().trim() === normalizedEmail
    )

    // Get additional user info if exists (for routing decisions)
    let userInfo = null
    if (userExists) {
      const foundUser = users.users.find(
        user => user.email?.toLowerCase().trim() === normalizedEmail
      )
      
      if (foundUser) {
        userInfo = {
          id: foundUser.id,
          emailConfirmed: !!foundUser.email_confirmed_at,
          provider: foundUser.app_metadata?.provider || 'email',
          lastSignIn: foundUser.last_sign_in_at
        }
      }
    }

    // Return result
    return new Response(
      JSON.stringify({ 
        exists: userExists,
        userInfo: userExists ? userInfo : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error in check-user-exists:', error)
    return new Response(
      JSON.stringify({ 
        exists: false,
        error: 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
