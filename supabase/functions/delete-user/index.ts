import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // User client to get the current user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client to delete user data and auth
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Delete all user data from various tables (in order of dependencies)
    const userId = user.id

    // Delete habit completions first (references habits)
    await adminClient.from('habit_completions').delete().eq('user_id', userId)
    
    // Delete habits
    await adminClient.from('habits').delete().eq('user_id', userId)
    
    // Delete tasks (references goals)
    await adminClient.from('tasks').delete().eq('user_id', userId)
    
    // Delete goals
    await adminClient.from('goals').delete().eq('user_id', userId)
    
    // Delete user challenge progress
    await adminClient.from('user_challenge_progress').delete().eq('user_id', userId)
    
    // Delete user achievements
    await adminClient.from('user_achievements').delete().eq('user_id', userId)
    
    // Delete session history
    await adminClient.from('session_history').delete().eq('user_id', userId)
    
    // Delete notifications
    await adminClient.from('notifications').delete().eq('user_id', userId)
    
    // Delete messages (both sent and received)
    await adminClient.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    
    // Delete group messages
    await adminClient.from('group_messages').delete().eq('sender_id', userId)
    
    // Delete group memberships
    await adminClient.from('group_members').delete().eq('user_id', userId)
    
    // Delete friendships (both directions)
    await adminClient.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    
    // Delete AI generations
    await adminClient.from('ai_generations').delete().eq('user_id', userId)
    
    // Delete subscriptions
    await adminClient.from('subscriptions').delete().eq('user_id', userId)
    
    // Delete profile
    await adminClient.from('profiles').delete().eq('id', userId)

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user authentication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account and all data deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})