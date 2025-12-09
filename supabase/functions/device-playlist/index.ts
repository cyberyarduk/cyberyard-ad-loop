import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token, x-battery-level, x-screen-width, x-screen-height',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('x-device-token');
    const batteryLevelHeader = req.headers.get('x-battery-level');
    const screenWidthHeader = req.headers.get('x-screen-width');
    const screenHeightHeader = req.headers.get('x-screen-height');
    console.log('Device playlist request, token present:', !!authToken, 'battery:', batteryLevelHeader, 'screen:', screenWidthHeader, 'x', screenHeightHeader);

    if (!authToken) {
      throw new Error('Device authentication token required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find device by auth token - accept both active and suspended
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, company_id, playlist_id, name, status')
      .eq('auth_token', authToken)
      .in('status', ['active', 'suspended'])
      .single();

    if (deviceError || !device) {
      console.error('Device not found or invalid:', deviceError);
      throw new Error('Invalid or inactive device');
    }

    console.log('Device authenticated:', device.id, 'Company:', device.company_id, 'Status:', device.status);

    // If device is suspended, return suspended status without videos
    if (device.status === 'suspended') {
      return new Response(
        JSON.stringify({
          success: true,
          suspended: true,
          device_id: device.id,
          device_name: device.name,
          company_id: device.company_id,
          videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse battery level and screen dimensions
    const batteryLevel = batteryLevelHeader ? parseInt(batteryLevelHeader, 10) : null;
    const screenWidth = screenWidthHeader ? parseInt(screenWidthHeader, 10) : null;
    const screenHeight = screenHeightHeader ? parseInt(screenHeightHeader, 10) : null;

    // Calculate aspect ratio
    let aspectRatio: string | null = null;
    if (screenWidth && screenHeight && screenWidth > 0 && screenHeight > 0) {
      const ratio = screenWidth / screenHeight;
      if (ratio > 1.3) {
        aspectRatio = 'landscape'; // 16:9 or wider
      } else if (ratio < 0.8) {
        aspectRatio = 'portrait'; // 9:16 or taller
      } else {
        aspectRatio = 'square'; // roughly 1:1
      }
    }

    // Update last_seen_at, battery_level, and screen dimensions
    const updateData: any = { last_seen_at: new Date().toISOString() };
    if (batteryLevel !== null && !isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) {
      updateData.battery_level = batteryLevel;
    }
    if (screenWidth && screenWidth > 0) {
      updateData.screen_width = screenWidth;
    }
    if (screenHeight && screenHeight > 0) {
      updateData.screen_height = screenHeight;
    }
    if (aspectRatio) {
      updateData.aspect_ratio = aspectRatio;
    }

    await supabase
      .from('devices')
      .update(updateData)
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
          video_url_landscape,
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
    // Select appropriate video URL based on device aspect ratio
    const videos = (playlistVideos || [])
      .filter(pv => pv.videos && pv.videos.company_id === device.company_id)
      .map(pv => {
        // Use landscape video if device is landscape and landscape version exists
        const videoUrl = aspectRatio === 'landscape' && pv.videos.video_url_landscape 
          ? pv.videos.video_url_landscape 
          : pv.videos.video_url;
        
        return {
          id: pv.videos.id,
          title: pv.videos.title,
          video_url: videoUrl,
          order_index: pv.order_index
        };
      });

    console.log(`Returning ${videos.length} videos for device ${device.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        suspended: false,
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