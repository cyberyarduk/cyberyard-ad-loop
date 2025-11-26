import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, mainText, subtext, duration, playlistId, deviceToken } = await req.json();
    console.log('Generating video with params:', { imageUrl, mainText, subtext, duration, playlistId, deviceToken: !!deviceToken });

    const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY');
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY not configured');
    }

    // Build tracks array with text assets and sparkle effects
    const tracks = [
      // Background image layer with zoom
      {
        clips: [
          {
            asset: {
              type: "image",
              src: imageUrl
            },
            start: 0,
            length: parseFloat(duration),
            fit: "cover",
            scale: 1.2,
            effect: "zoomIn"
          }
        ]
      },
      // Dark vignette overlay
      {
        clips: [
          {
            asset: {
              type: "luma",
              src: "https://shotstack-assets.s3.amazonaws.com/luma-mattes/vignette.mp4"
            },
            start: 0,
            length: parseFloat(duration)
          }
        ]
      },
      // Sparkle/particles overlay
      {
        clips: [
          {
            asset: {
              type: "video",
              src: "https://shotstack-assets.s3.amazonaws.com/footage/particles-white.mp4"
            },
            start: 0,
            length: parseFloat(duration),
            opacity: 0.4
          }
        ]
      },
      // Main text using title asset
      {
        clips: [
          {
            asset: {
              type: "title",
              text: mainText,
              style: "future",
              color: "#ffffff",
              size: "large",
              background: "rgba(0,0,0,0.7)",
              position: "center",
              offset: {
                y: -0.2
              }
            },
            start: 0,
            length: parseFloat(duration),
            transition: {
              in: "slideDown",
              out: "slideUp"
            }
          }
        ]
      }
    ];

    // Add subtext if provided
    if (subtext && subtext.trim()) {
      tracks.push({
        clips: [
          {
            asset: {
              type: "title",
              text: subtext,
              style: "subtitle",
              color: "#ffffff",
              size: "medium",
              background: "rgba(0,0,0,0.8)",
              position: "center",
              offset: {
                y: 0.15
              }
            },
            start: 0,
            length: parseFloat(duration),
            transition: {
              in: "slideUp",
              out: "slideDown"
            }
          }
        ]
      });
    }

    // Create Shotstack edit
    const shotstackEdit = {
      timeline: {
        background: "#000000",
        tracks
      },
      output: {
        format: "mp4",
        aspectRatio: "9:16",
        size: {
          width: 1080,
          height: 1920
        }
      }
    };

    console.log('Sending request to Shotstack API');
    
    // Submit render to Shotstack
    const renderResponse = await fetch('https://api.shotstack.io/v1/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY
      },
      body: JSON.stringify(shotstackEdit)
    });

    if (!renderResponse.ok) {
      const error = await renderResponse.text();
      console.error('Shotstack API error:', error);
      throw new Error(`Shotstack API error: ${error}`);
    }

    const renderData = await renderResponse.json();
    console.log('Render submitted:', renderData);
    
    const renderId = renderData.response.id;

    // Poll for completion
    console.log('Polling for render completion...');
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
        headers: {
          'x-api-key': SHOTSTACK_API_KEY
        }
      });

      if (!statusResponse.ok) {
        console.error('Status check failed:', await statusResponse.text());
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log('Render status:', statusData.response.status);

      if (statusData.response.status === 'done') {
        videoUrl = statusData.response.url;
        console.log('Video ready:', videoUrl);
        break;
      } else if (statusData.response.status === 'failed') {
        throw new Error('Video rendering failed');
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    // Save video to database
    let userId: string;
    let companyId: string | null = null;

    // Support both user JWT auth and device token auth
    if (deviceToken) {
      console.log('Using device token authentication');
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Find device by token
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id, user_id, company_id')
        .eq('auth_token', deviceToken)
        .eq('status', 'active')
        .single();

      if (deviceError || !device) {
        throw new Error('Invalid device token');
      }

      userId = device.user_id;
      companyId = device.company_id;
      console.log('Device authenticated:', device.id, 'Company:', companyId);
    } else {
      // Standard JWT authentication
      const authHeader = req.headers.get('Authorization');
      console.log('Auth header received:', authHeader ? 'Yes' : 'No');
      
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      
      console.log('User ID from token:', userId);
      
      if (!userId) {
        throw new Error('Could not extract user ID from token');
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader }
          }
        }
      );

      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      companyId = profile?.company_id || null;
      console.log('Profile fetched:', profile);
    }

    // Create service role client to bypass RLS
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('Service role key exists:', !!serviceRoleKey);
    console.log('Supabase URL exists:', !!supabaseUrl);
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert video record
    const videoData = {
      title: mainText || 'AI Generated Video',
      video_url: videoUrl,
      user_id: userId,
      company_id: companyId,
      source: 'ai_generated'
    };
    
    console.log('Inserting video with data:', videoData);
    
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      console.error('Error saving video:', JSON.stringify(videoError, null, 2));
      throw new Error(`Failed to save video to database: ${videoError.message}`);
    }

    // Add to playlist if specified
    if (playlistId && video) {
      const { data: existingVideos } = await supabase
        .from('playlist_videos')
        .select('order_index')
        .eq('playlist_id', playlistId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = existingVideos && existingVideos.length > 0 
        ? existingVideos[0].order_index + 1 
        : 0;

      const { error: playlistError } = await supabase
        .from('playlist_videos')
        .insert({
          playlist_id: playlistId,
          video_id: video.id,
          order_index: nextOrder
        });

      if (playlistError) {
        console.error('Error adding to playlist:', playlistError);
      }
    }

    console.log('Video generation complete:', video);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl,
        videoId: video.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-video function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
