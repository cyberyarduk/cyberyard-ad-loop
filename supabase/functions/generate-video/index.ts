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
    const { imageUrl, mainText, subtext, duration, style = 'boom', playlistId, deviceToken } = await req.json();
    console.log('Generating video with params:', { imageUrl, mainText, subtext, duration, style, playlistId, deviceToken: !!deviceToken });

    const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY');
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY not configured');
    }

    // Get style-specific configurations
    const getStyleConfig = (styleName: string) => {
      switch(styleName) {
        case 'boom':
          return {
            mainBg: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
            mainColor: '#ffffff',
            mainSize: '110px',
            mainTransform: 'rotate(-3deg) scale(1.05)',
            mainShadow: '5px 5px 15px rgba(0,0,0,0.9), 0 0 30px rgba(255,8,68,0.5)',
            sparkleHtml: `<div style="position: absolute; width: 40px; height: 40px; background: radial-gradient(circle, #fff 0%, transparent 70%); top: 15%; left: 25%; animation: explode 1.5s infinite;"></div>
              <div style="position: absolute; width: 35px; height: 35px; background: radial-gradient(circle, #ffeb3b 0%, transparent 70%); top: 60%; left: 75%; animation: explode 2s infinite 0.5s;"></div>
              <style>@keyframes explode { 0%, 100% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.5); opacity: 1; }}</style>`
          };
        case 'sparkle':
          return {
            mainBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            mainColor: '#ffffff',
            mainSize: '95px',
            mainTransform: 'rotate(0deg)',
            mainShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(102,126,234,0.4)',
            sparkleHtml: `<div style="position: absolute; width: 15px; height: 15px; background: white; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); top: 20%; left: 30%; animation: twinkle 2s infinite;"></div>
              <div style="position: absolute; width: 20px; height: 20px; background: white; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); top: 50%; left: 70%; animation: twinkle 2.5s infinite 0.5s;"></div>
              <style>@keyframes twinkle { 0%, 100% { opacity: 0; transform: rotate(0deg) scale(0); } 50% { opacity: 1; transform: rotate(180deg) scale(1); }}</style>`
          };
        case 'stars':
          return {
            mainBg: 'linear-gradient(135deg, #4b0082 0%, #ff1493 100%)',
            mainColor: '#ffffff',
            mainSize: '90px',
            mainTransform: 'rotate(0deg)',
            mainShadow: '0 10px 40px rgba(0,0,0,0.7), 0 0 30px rgba(255,20,147,0.6)',
            sparkleHtml: `<div style="position: absolute; width: 25px; height: 25px; background: radial-gradient(circle, #fff 20%, #ffeb3b 40%, transparent 70%); border-radius: 50%; top: 25%; left: 20%; animation: float 3s infinite;"></div>
              <div style="position: absolute; width: 20px; height: 20px; background: radial-gradient(circle, #fff 20%, #ff1493 40%, transparent 70%); border-radius: 50%; top: 65%; left: 80%; animation: float 3.5s infinite 1s;"></div>
              <style>@keyframes float { 0%, 100% { transform: translateY(0px); opacity: 0.5; } 50% { transform: translateY(-20px); opacity: 1; }}</style>`
          };
        case 'minimal':
          return {
            mainBg: '#ffffff',
            mainColor: '#000000',
            mainSize: '85px',
            mainTransform: 'rotate(0deg)',
            mainShadow: '0 5px 20px rgba(0,0,0,0.3)',
            sparkleHtml: ''
          };
        default:
          return getStyleConfig('boom');
      }
    };

    const styleConfig = getStyleConfig(style);

    // Build tracks array with style-based design
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
      // Semi-transparent dark overlay
      {
        clips: [
          {
            asset: {
              type: "html",
              html: `<div style="width: 100%; height: 100%; background: rgba(0,0,0,0.5);"></div>`,
              width: 1080,
              height: 1920
            },
            start: 0,
            length: parseFloat(duration)
          }
        ]
      }
    ];

    // Add sparkle effect if style has one
    if (styleConfig.sparkleHtml) {
      tracks.push({
        clips: [
          {
            asset: {
              type: "html",
              html: `<div style="width: 100%; height: 100%; overflow: hidden;">${styleConfig.sparkleHtml}</div>`,
              width: 1080,
              height: 1920
            },
            start: 0,
            length: parseFloat(duration)
          }
        ]
      });
    }

    // Add main text
    tracks.push({
      clips: [
        {
          asset: {
            type: "html",
            html: `
              <div style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                font-family: 'Impact', 'Arial Black', sans-serif;
                padding-top: 600px;
              ">
                <div style="
                  display: inline-block;
                  background: ${styleConfig.mainBg};
                  padding: 35px 55px;
                  border-radius: 25px;
                  box-shadow: ${styleConfig.mainShadow};
                  border: 5px solid rgba(255,255,255,0.3);
                  transform: ${styleConfig.mainTransform};
                ">
                  <h1 style="
                    color: ${styleConfig.mainColor};
                    font-size: ${styleConfig.mainSize};
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    line-height: 1.1;
                  ">${mainText}</h1>
                </div>
              </div>
            `,
            width: 1080,
            height: 1920
          },
          start: 0,
          length: parseFloat(duration)
        }
      ]
    });

    // Add subtext if provided
    if (subtext && subtext.trim()) {
      tracks.push({
        clips: [
          {
            asset: {
              type: "html",
              html: `
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  font-family: 'Arial', sans-serif;
                  padding-top: 1200px;
                ">
                  <div style="
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 20px 40px;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                  ">
                    <p style="
                      color: #333333;
                      font-size: 60px;
                      font-weight: 700;
                      margin: 0;
                    ">${subtext}</p>
                  </div>
                </div>
              `,
              width: 1080,
              height: 1920
            },
            start: 0,
            length: parseFloat(duration)
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
