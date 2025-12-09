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

    const landscapeStylePrompts: Record<string, string> = {
      boom: `Take this product image and transform it into an eye-catching promotional poster in 1920x1080 landscape format. Add bold, explosive text "${mainText}" in huge letters with vibrant red and pink gradients, dramatic shadows, and energy burst effects. Make it look like a dramatic product advertisement with WOW factor.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      sparkle: `Take this product image and transform it into a magical promotional poster in 1920x1080 landscape format. Add elegant text "${mainText}" with purple-to-blue gradients, sparkles, and dreamy glowing effects. Make it enchanting and eye-catching.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      stars: `Take this product image and transform it into a glamorous promotional poster in 1920x1080 landscape format. Add stylish text "${mainText}" with hot pink colors, star decorations, and dazzling celebrity-style effects. Make it fabulous and attention-grabbing.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`,
      minimal: `Take this product image and transform it into a clean promotional poster in 1920x1080 landscape format. Add modern text "${mainText}" in bold sans-serif font with simple, professional styling. Keep it minimal but impactful.${subtext ? ` Include smaller text "${subtext}" below the main text.` : ''}`
    };

    const textPrompt = stylePrompts[style] || stylePrompts.boom;
    const landscapePrompt = landscapeStylePrompts[style] || landscapeStylePrompts.boom;
    
    // Generate both portrait and landscape images in parallel
    console.log('Generating portrait and landscape promotional images with AI...');
    
    const [portraitAiResponse, landscapeAiResponse] = await Promise.all([
      fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: textPrompt },
              { type: 'image_url', image_url: { url: finalImageUrl } }
            ]
          }],
          modalities: ['image', 'text']
        })
      }),
      fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: landscapePrompt },
              { type: 'image_url', image_url: { url: finalImageUrl } }
            ]
          }],
          modalities: ['image', 'text']
        })
      })
    ]);

    if (!portraitAiResponse.ok) {
      const errorText = await portraitAiResponse.text();
      console.error('Portrait AI error:', errorText);
      throw new Error(`Failed to generate portrait image: ${errorText}`);
    }

    const portraitData = await portraitAiResponse.json();
    const portraitImageBase64 = portraitData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!portraitImageBase64) {
      throw new Error('No portrait promotional image generated from AI');
    }

    // Landscape is optional - continue even if it fails
    let landscapeImageBase64 = null;
    if (landscapeAiResponse.ok) {
      const landscapeData = await landscapeAiResponse.json();
      landscapeImageBase64 = landscapeData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      console.log('Landscape image generated:', !!landscapeImageBase64);
    } else {
      console.log('Landscape generation failed, continuing with portrait only');
    }

    console.log('Promotional images generated, uploading to storage...');
    
    // Upload both images
    const timestamp = Date.now();
    
    const portraitBase64Data = portraitImageBase64.split(',')[1];
    const portraitBinaryData = Uint8Array.from(atob(portraitBase64Data), c => c.charCodeAt(0));
    const portraitImagePath = `promo-images/${timestamp}-portrait.png`;
    
    const uploadPromises: Promise<any>[] = [
      supabase.storage.from('videos').upload(portraitImagePath, portraitBinaryData, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '31536000'
      })
    ];

    let landscapeImagePath: string | null = null;
    if (landscapeImageBase64) {
      const landscapeBase64Data = landscapeImageBase64.split(',')[1];
      const landscapeBinaryData = Uint8Array.from(atob(landscapeBase64Data), c => c.charCodeAt(0));
      landscapeImagePath = `promo-images/${timestamp}-landscape.png`;
      uploadPromises.push(
        supabase.storage.from('videos').upload(landscapeImagePath, landscapeBinaryData, {
          contentType: 'image/png',
          upsert: false,
          cacheControl: '31536000'
        })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);
    
    if (uploadResults[0].error) {
      console.error('Portrait upload error:', uploadResults[0].error);
      throw new Error(`Failed to upload portrait image: ${uploadResults[0].error.message}`);
    }
    
    const { data: { publicUrl: portraitImageUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(portraitImagePath);
    
    let landscapeImageUrl: string | null = null;
    if (landscapeImagePath && uploadResults[1] && !uploadResults[1].error) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(landscapeImagePath);
      landscapeImageUrl = publicUrl;
    }
    
    console.log('Promotional images uploaded:', { portrait: portraitImageUrl, landscape: landscapeImageUrl });

    // Create Shotstack edits for both formats
    const videoDuration = parseFloat(duration);

    // Simple portrait edit - just the image with gentle zoom
    const portraitEdit = {
      timeline: {
        background: "#000000",
        tracks: [
          {
            clips: [{
              asset: { type: "image", src: portraitImageUrl },
              start: 0,
              length: videoDuration,
              effect: "slideUp"
            }]
          }
        ]
      },
      output: {
        format: "mp4",
        aspectRatio: "9:16",
        size: { width: 1080, height: 1920 }
      }
    };

    // Simple landscape edit
    const landscapeEdit = landscapeImageUrl ? {
      timeline: {
        background: "#000000",
        tracks: [
          {
            clips: [{
              asset: { type: "image", src: landscapeImageUrl },
              start: 0,
              length: videoDuration,
              effect: "slideUp"
            }]
          }
        ]
      },
      output: {
        format: "mp4",
        aspectRatio: "16:9",
        size: { width: 1920, height: 1080 }
      }
    } : null;

    console.log('Submitting render requests to Shotstack API');
    
    // Submit both renders in parallel
    const renderPromises: Promise<Response>[] = [
      fetch('https://api.shotstack.io/v1/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': SHOTSTACK_API_KEY },
        body: JSON.stringify(portraitEdit)
      })
    ];

    if (landscapeEdit) {
      renderPromises.push(
        fetch('https://api.shotstack.io/v1/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': SHOTSTACK_API_KEY },
          body: JSON.stringify(landscapeEdit)
        })
      );
    }

    const renderResponses = await Promise.all(renderPromises);

    if (!renderResponses[0].ok) {
      const error = await renderResponses[0].text();
      console.error('Portrait Shotstack API error:', error);
      throw new Error(`Portrait Shotstack API error: ${error}`);
    }

    const portraitRenderData = await renderResponses[0].json();
    const portraitRenderId = portraitRenderData.response.id;
    console.log('Portrait render submitted:', portraitRenderId);

    let landscapeRenderId: string | null = null;
    if (renderResponses[1] && renderResponses[1].ok) {
      const landscapeRenderData = await renderResponses[1].json();
      landscapeRenderId = landscapeRenderData.response.id;
      console.log('Landscape render submitted:', landscapeRenderId);
    }

    // Poll for completion of both renders
    console.log('Polling for render completion...');
    let videoUrl: string | null = null;
    let videoUrlLandscape: string | null = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && (!videoUrl || (landscapeRenderId && !videoUrlLandscape))) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check portrait status
      if (!videoUrl) {
        const statusResponse = await fetch(`https://api.shotstack.io/v1/render/${portraitRenderId}`, {
          headers: { 'x-api-key': SHOTSTACK_API_KEY }
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Portrait render status:', statusData.response.status);
          if (statusData.response.status === 'done') {
            videoUrl = statusData.response.url;
            console.log('Portrait video ready:', videoUrl);
          } else if (statusData.response.status === 'failed') {
            throw new Error('Portrait video rendering failed');
          }
        }
      }

      // Check landscape status
      if (landscapeRenderId && !videoUrlLandscape) {
        const statusResponse = await fetch(`https://api.shotstack.io/v1/render/${landscapeRenderId}`, {
          headers: { 'x-api-key': SHOTSTACK_API_KEY }
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Landscape render status:', statusData.response.status);
          if (statusData.response.status === 'done') {
            videoUrlLandscape = statusData.response.url;
            console.log('Landscape video ready:', videoUrlLandscape);
          } else if (statusData.response.status === 'failed') {
            console.log('Landscape video rendering failed, continuing with portrait only');
            landscapeRenderId = null; // Stop checking
          }
        }
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Portrait video generation timed out');
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
    const videoData: any = {
      title: mainText || 'AI Generated Video',
      video_url: videoUrl,
      user_id: userId,
      company_id: companyId,
      source: 'ai_generated',
      ai_prompt: mainText,
      ai_style: style,
      ai_duration: duration,
      ai_image_url: finalImageUrl
    };
    
    // Add landscape URL if available
    if (videoUrlLandscape) {
      videoData.video_url_landscape = videoUrlLandscape;
    }
    
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
        videoUrlLandscape: videoUrlLandscape || null,
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
