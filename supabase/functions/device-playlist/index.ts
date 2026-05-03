import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token, x-battery-level, x-screen-width, x-screen-height',
};

// Convert "HH:MM[:SS]" to minutes-since-midnight
const toMinutes = (t?: string | null): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map((n) => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

// Get current local minutes/day-of-week for a given IANA timezone.
const localNow = (tz: string) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', hour12: false,
      weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dayMap[parts.weekday] ?? 0;
    const minutes = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
    return { dow, minutes, isoDate };
  } catch {
    const d = new Date();
    return { dow: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes(), isoDate: d.toISOString().slice(0, 10) };
  }
};

// Within [start, end] minutes window. Supports overnight (start > end).
const inTimeWindow = (now: number, start: number | null, end: number | null) => {
  if (start == null && end == null) return true;
  if (start != null && end == null) return now >= start;
  if (start == null && end != null) return now < end;
  if (start! <= end!) return now >= start! && now < end!;
  // Overnight
  return now >= start! || now < end!;
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

    if (!authToken) {
      throw new Error('Device authentication token required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, company_id, playlist_id, name, status, aspect_ratio, working_hours_enabled, working_hours_start, working_hours_end, timezone')
      .eq('auth_token', authToken)
      .in('status', ['active', 'suspended'])
      .single();

    if (deviceError || !device) {
      throw new Error('Invalid or inactive device');
    }

    if (device.status === 'suspended') {
      return new Response(
        JSON.stringify({
          success: true, suspended: true,
          device_id: device.id, device_name: device.name, company_id: device.company_id, videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const batteryLevel = batteryLevelHeader ? parseInt(batteryLevelHeader, 10) : null;
    const screenWidth = screenWidthHeader ? parseInt(screenWidthHeader, 10) : null;
    const screenHeight = screenHeightHeader ? parseInt(screenHeightHeader, 10) : null;

    let aspectRatio: string | null = device.aspect_ratio ?? null;
    if (screenWidth && screenHeight && screenWidth > 0 && screenHeight > 0) {
      const ratio = screenWidth / screenHeight;
      if (ratio > 1.3) aspectRatio = 'landscape';
      else if (ratio < 0.8) aspectRatio = 'portrait';
      else aspectRatio = 'square';
    }

    const updateData: any = { last_seen_at: new Date().toISOString() };
    if (batteryLevel !== null && !isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) updateData.battery_level = batteryLevel;
    if (screenWidth && screenWidth > 0) updateData.screen_width = screenWidth;
    if (screenHeight && screenHeight > 0) updateData.screen_height = screenHeight;
    if (aspectRatio) updateData.aspect_ratio = aspectRatio;
    await supabase.from('devices').update(updateData).eq('id', device.id);

    // Local time + emergency state
    const tz = device.timezone || 'Europe/London';
    const { dow, minutes, isoDate } = localNow(tz);

    const { data: company } = await supabase
      .from('companies')
      .select('emergency_active, emergency_message, emergency_started_at')
      .eq('id', device.company_id)
      .single();

    const emergency = company?.emergency_active
      ? { active: true, message: company.emergency_message ?? 'Emergency', started_at: company.emergency_started_at }
      : { active: false };

    // Working hours check
    const whStart = toMinutes(device.working_hours_start);
    const whEnd = toMinutes(device.working_hours_end);
    const offHours = device.working_hours_enabled && !inTimeWindow(minutes, whStart, whEnd);

    if (offHours && !emergency.active) {
      return new Response(
        JSON.stringify({
          success: true, suspended: false, off_hours: true, emergency,
          device_id: device.id, device_name: device.name, company_id: device.company_id, videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let playlistId = device.playlist_id;
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
          success: true, emergency,
          device_id: device.id, device_name: device.name, company_id: device.company_id, playlist: null, videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check playlist active window
    const { data: playlistMeta } = await supabase
      .from('playlists')
      .select('active_start_date, active_end_date')
      .eq('id', playlistId)
      .single();

    const playlistActive =
      (!playlistMeta?.active_start_date || playlistMeta.active_start_date <= isoDate) &&
      (!playlistMeta?.active_end_date || playlistMeta.active_end_date >= isoDate);

    if (!playlistActive && !emergency.active) {
      return new Response(
        JSON.stringify({
          success: true, off_hours: false, playlist_inactive: true, emergency,
          device_id: device.id, device_name: device.name, company_id: device.company_id, playlist_id: playlistId, videos: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: playlistVideos, error: playlistError } = await supabase
      .from('playlist_videos')
      .select(`
        order_index,
        video_id,
        schedule_start_date,
        schedule_end_date,
        schedule_days_of_week,
        schedule_start_time,
        schedule_end_time,
        videos (
          id,
          title,
          video_url,
          video_url_landscape,
          display_duration,
          company_id,
          media_type,
          image_url,
          image_url_landscape,
          player_overlay,
          source_url,
          expires_at
        )
      `)
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true });

    if (playlistError) throw new Error('Failed to fetch playlist');

    const nowIso = new Date().toISOString();

    const videos = (playlistVideos || [])
      .filter((pv: any) => pv.videos && pv.videos.company_id === device.company_id)
      .filter((pv: any) => !pv.videos.expires_at || pv.videos.expires_at > nowIso)
      // Per-item schedule rules
      .filter((pv: any) => {
        if (pv.schedule_start_date && pv.schedule_start_date > isoDate) return false;
        if (pv.schedule_end_date && pv.schedule_end_date < isoDate) return false;
        if (Array.isArray(pv.schedule_days_of_week) && pv.schedule_days_of_week.length > 0 && !pv.schedule_days_of_week.includes(dow)) return false;
        const s = toMinutes(pv.schedule_start_time);
        const e = toMinutes(pv.schedule_end_time);
        if (!inTimeWindow(minutes, s, e)) return false;
        return true;
      })
      .map((pv: any) => {
        const v = pv.videos;
        const hasImageVariant = !!(v.image_url || v.image_url_landscape);
        const hasVideoVariant = !!(v.video_url || v.video_url_landscape);
        const looksLikeImageUrl = (url?: string | null) => !!url && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url);
        const looksLikeVideoUrl = (url?: string | null) => !!url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

        if (v.media_type === 'youtube' || v.media_type === 'webpage') {
          if (!v.source_url) return null;
          return {
            id: v.id, title: v.title, media_type: v.media_type,
            video_url: v.source_url, source_url: v.source_url,
            image_url: v.image_url ?? null,
            display_duration: v.display_duration ?? null,
            player_overlay: v.player_overlay ?? null,
            order_index: pv.order_index,
          };
        }

        const isImage = v.media_type === 'image'
          ? true
          : v.media_type === 'video' ? false
          : (hasVideoVariant && (looksLikeVideoUrl(v.video_url) || looksLikeVideoUrl(v.video_url_landscape))) ? false
          : (hasImageVariant || looksLikeImageUrl(v.video_url) || looksLikeImageUrl(v.video_url_landscape));
        const isLandscape = aspectRatio === 'landscape';

        const mediaUrl = isImage
          ? (isLandscape ? (v.image_url_landscape || v.image_url) : (v.image_url || v.image_url_landscape))
          : (isLandscape ? (v.video_url_landscape || v.video_url) : (v.video_url || v.video_url_landscape));

        return {
          id: v.id, title: v.title,
          media_type: isImage ? 'image' : 'video',
          video_url: mediaUrl,
          image_url: isImage ? mediaUrl : null,
          display_duration: v.display_duration ?? null,
          player_overlay: v.player_overlay ?? null,
          order_index: pv.order_index
        };
      })
      .filter((v: any) => v && !!v.video_url);

    return new Response(
      JSON.stringify({
        success: true, suspended: false, off_hours: false, emergency,
        device_id: device.id, device_name: device.name, company_id: device.company_id,
        playlist_id: playlistId, videos
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Device playlist error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
