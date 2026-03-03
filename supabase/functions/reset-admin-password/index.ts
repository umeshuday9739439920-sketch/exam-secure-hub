import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { password, secret, deleteUserIds } = await req.json()

    if (secret !== 'temp-reset-2025') {
      throw new Error('Unauthorized')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Delete users if requested
    if (deleteUserIds && Array.isArray(deleteUserIds)) {
      for (const uid of deleteUserIds) {
        await supabaseAdmin.auth.admin.deleteUser(uid)
      }
    }

    // Update admin password
    if (password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        '560f29d4-b254-409a-b64c-8cc7418a0e9a',
        { password }
      )
      if (error) throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Done' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
