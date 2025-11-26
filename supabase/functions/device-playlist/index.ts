import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('x-device-token');
    console.log('Device playlist request, token present:', !!authToken);

    if (!authToken) {
      throw new Error('Device authentication token required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find device by auth token
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, company_id, playlist_id, name, status')
      .eq('auth_token', authToken)
      .eq('status', 'active')
      .single();

    if (deviceError || !device) {
      console.error('Device not found or inactive:', deviceError);
      throw new Error('Invalid or inactive device');
    }

    console.log('Device authenticated:', device.id, 'Company:', device.company_id);

    // Update last_seen_at
    await supabase
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', device.id);

    // Determine which playlist to use
    let playlistId = device.playlist_id;

    // If no specific playlist assigned, get company's first playlist
    if (!playlistId) {
      const { data: defaultPlaylist } = await supabase
        .from('playlists')
        .select('id')
        .eq('company_id', device.company_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      playlistId = defaultPlaylist?.id;
    }

    if (!playlistId) {
      return new Response(
        JSON.stringify({
          success: true,
          device_id: device.id,
          device_name: device.name,
          company_id: device.company_id,
          playlist: null,
          videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get playlist with videos
    const { data: playlistVideos, error: playlistError } = await supabase
      .from('playlist_videos')
      .select(`
        order_index,
        video_id,
        videos (
          id,
          title,
          video_url,
          company_id
        )
      `)
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true });

    if (playlistError) {
      console.error('Error fetching playlist videos:', playlistError);
      throw new Error('Failed to fetch playlist');
    }

    // Filter videos to only include those from this company and format response
    const videos = (playlistVideos || [])
      .filter(pv => pv.videos && pv.videos.company_id === device.company_id)
      .map(pv => ({
        id: pv.videos.id,
        title: pv.videos.title,
        video_url: pv.videos.video_url,
        order_index: pv.order_index
      }));

    console.log(`Returning ${videos.length} videos for device ${device.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        device_id: device.id,
        device_name: device.name,
        company_id: device.company_id,
        playlist_id: playlistId,
        videos
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Device playlist error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
