import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate text overlay images using Lovable AI
    console.log('Generating text overlay with AI...');
    
    const stylePrompts: Record<string, string> = {
      boom: `Create a bold text overlay image (1080x400px transparent background) with the text "${mainText}" in huge bold letters with a vibrant red-to-pink gradient background, dramatic shadows, and an explosive, energetic style. Make it eye-catching and dynamic.`,
      sparkle: `Create a magical text overlay image (1080x400px transparent background) with the text "${mainText}" in elegant letters with purple-to-blue gradients, sparkles, and a dreamy, enchanting style.`,
      stars: `Create a glamorous text overlay image (1080x400px transparent background) with the text "${mainText}" in stylish letters with hot pink colors, star decorations, and a dazzling celebrity style.`,
      minimal: `Create a clean text overlay image (1080x400px transparent background) with the text "${mainText}" in modern sans-serif font, simple black text on white background, minimalist and professional.`
    };

    const textPrompt = stylePrompts[style] || stylePrompts.boom;
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: textPrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Failed to generate text overlay: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const textOverlayBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!textOverlayBase64) {
      throw new Error('No image generated from AI');
    }

    console.log('Text overlay generated successfully');

    // Build tracks with background image and AI-generated text overlay
    const tracks = [
      // Background image with zoom
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
      // AI-generated text overlay
      {
        clips: [
          {
            asset: {
              type: "image",
              src: textOverlayBase64
            },
            start: 0,
            length: parseFloat(duration),
            fit: "none",
            position: "center",
            offset: {
              x: 0,
              y: -0.1
            },
            opacity: 1,
            effect: "slideUp"
          }
        ]
      }
    ];

    // Add subtext overlay if provided
    if (subtext && subtext.trim()) {
      const subtextPrompt = `Create a simple text overlay image (1080x200px transparent background) with the text "${subtext}" in medium-sized white letters with subtle shadow for readability.`;
      
      const subtextAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [
            {
              role: 'user',
              content: subtextPrompt
            }
          ],
          modalities: ['image', 'text']
        })
      });

      if (subtextAiResponse.ok) {
        const subtextAiData = await subtextAiResponse.json();
        const subtextOverlayBase64 = subtextAiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (subtextOverlayBase64) {
          tracks.push({
            clips: [
              {
                asset: {
                  type: "image",
                  src: subtextOverlayBase64
                },
                start: 0.3,
                length: parseFloat(duration) - 0.3,
                fit: "none",
                position: "center",
                offset: {
                  x: 0,
                  y: 0.3
                },
                opacity: 1,
                effect: "slideUp"
              }
            ]
          });
        }
      }
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
