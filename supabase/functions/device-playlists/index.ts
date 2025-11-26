import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get device token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deviceToken = authHeader.replace('Bearer ', '');
    console.log('Looking up device with token');

    // Lookup device by auth_token
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, company_id, name')
      .eq('auth_token', deviceToken)
      .single();

    if (deviceError || !device) {
      console.error('Device not found:', deviceError);
      return new Response(
        JSON.stringify({ error: 'Invalid device token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Device found:', device.id, 'Company:', device.company_id);

    // Fetch playlists for the device's company
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('id, name, created_at, company_id')
      .eq('company_id', device.company_id)
      .order('created_at', { ascending: false });

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch playlists' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Playlists found:', playlists?.length || 0);

    return new Response(
      JSON.stringify({ playlists: playlists || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
