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
    const { imageUrl, imageData, mainText, subtext, duration, style = 'boom', playlistId, deviceToken } = await req.json();
    console.log('Generating video with params:', { hasImageUrl: !!imageUrl, hasImageData: !!imageData, mainText, subtext, duration, style, playlistId, deviceToken: !!deviceToken });

    const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
    }

    // Create Supabase client for storage operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Upload base64 image to storage if provided
    let finalImageUrl = imageUrl;
    
    if (imageData && !imageUrl) {
      console.log('Uploading base64 image to storage...');
      
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${crypto.randomUUID()}.jpg`;
      const filePath = `offer-images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('videos')
        .getPublicUrl(filePath);

      finalImageUrl = publicUrl;
      console.log('Image uploaded successfully:', finalImageUrl);
    }

    if (!finalImageUrl) {
      throw new Error('No image provided (imageUrl or imageData required)');
    }

    // Generate complete promotional image with text using Lovable AI
    console.log('Generating complete promotional image with AI...');
    
    const stylePrompts: Record<string, string> = {
      boom: `Take this product image and transform it into an eye-catching promotional poster in 1080x1920 portrait format. Add bold, explosive text "${mainText}" in huge letters with vibrant red and pink gradients, dramatic shadows, and energy burst effects. Make it look like a dramatic product advertisement with WOW factor.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      sparkle: `Take this product image and transform it into a magical promotional poster in 1080x1920 portrait format. Add elegant text "${mainText}" with purple-to-blue gradients, sparkles, and dreamy glowing effects. Make it enchanting and eye-catching.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      stars: `Take this product image and transform it into a glamorous promotional poster in 1080x1920 portrait format. Add stylish text "${mainText}" with hot pink colors, star decorations, and dazzling celebrity-style effects. Make it fabulous and attention-grabbing.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      minimal: `Take this product image and transform it into a clean promotional poster in 1080x1920 portrait format. Add modern text "${mainText}" in bold sans-serif font with simple, professional styling. Keep it minimal but impactful.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`
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
            content: [
              {
                type: 'text',
                text: textPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: finalImageUrl
                }
              }
            ]
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
    const completeImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!completeImageBase64) {
      throw new Error('No promotional image generated from AI');
    }

    console.log('Complete promotional image generated, uploading to storage...');
    
    // Convert base64 to blob
    const base64Data = completeImageBase64.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const timestamp = Date.now();
    const promoImagePath = `promo-images/${timestamp}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(promoImagePath, binaryData, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload promotional image: ${uploadError.message}`);
    }
    
    const { data: { publicUrl: promoImageUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(promoImagePath);
    
    console.log('Promotional image uploaded successfully:', promoImageUrl);

    // Build simple track with just the complete promotional image
    const tracks = [
      {
        clips: [
          {
            asset: {
              type: "image",
              src: promoImageUrl
            },
            start: 0,
            length: parseFloat(duration),
            fit: "cover",
            effect: "zoomIn"
          }
        ]
      }
    ];

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
    if (playlistId && playlistId !== 'default' && video) {
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
