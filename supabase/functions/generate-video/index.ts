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
    const { imageUrl, mainText, subtext, duration, playlistId } = await req.json();
    console.log('Generating video with params:', { imageUrl, mainText, subtext, duration, playlistId });

    const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY');
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY not configured');
    }

    // Create Shotstack edit
    const shotstackEdit = {
      timeline: {
        background: "#000000",
        tracks: [
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
                scale: 1
              }
            ]
          },
          {
            clips: [
              {
                asset: {
                  type: "html",
                  html: `<p style="color: white; font-size: 80px; font-weight: bold; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">${mainText}</p>`,
                  width: 1080,
                  height: 300,
                  position: "center"
                },
                start: 0,
                length: parseFloat(duration),
                offset: {
                  y: -0.25
                },
                transition: {
                  in: "fade",
                  out: "fade"
                }
              }
            ]
          },
          {
            clips: subtext ? [
              {
                asset: {
                  type: "html",
                  html: `<p style="color: white; font-size: 50px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">${subtext}</p>`,
                  width: 1080,
                  height: 200,
                  position: "center"
                },
                start: 0,
                length: parseFloat(duration),
                offset: {
                  y: 0.25
                },
                transition: {
                  in: "fade",
                  out: "fade"
                }
              }
            ] : []
          }
        ]
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    // Insert video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        title: mainText || 'AI Generated Video',
        video_url: videoUrl,
        user_id: user.id,
        company_id: profile?.company_id
      })
      .select()
      .single();

    if (videoError) {
      console.error('Error saving video:', videoError);
      throw new Error('Failed to save video to database');
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
