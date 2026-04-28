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
    const { imageUrl, imageData, mainText, subtext, duration, style = 'boom', playlistId, deviceToken, customization, price, limitedOffer, badgeText } = await req.json();
    console.log('Generating video with params:', { hasImageUrl: !!imageUrl, hasImageData: !!imageData, mainText, subtext, duration, style, playlistId, deviceToken: !!deviceToken, customization, price, limitedOffer, badgeText });

    // Resolve title/price: prefer explicit `price`, fall back to subtext for backward compat.
    const titleText = (mainText || '').toString().trim();
    const priceText = (price || subtext || '').toString().trim();
    const showBadge = !!limitedOffer;
    const finalBadgeText = (badgeText || 'TODAY ONLY').toString().trim().toUpperCase().slice(0, 20);

    // ===== Build customization prompt fragment =====
    const fontDescriptions: Record<string, string> = {
      'bold-sans': 'a bold, heavy sans-serif font (like Impact or Bebas Neue)',
      'elegant-serif': 'an elegant serif font (like Playfair Display or Didot)',
      'handwritten': 'a handwritten brush-script font with personality',
      'modern-display': 'a modern geometric display font (like Futura or Eurostile)',
      'rounded': 'a rounded, soft, friendly font (like Quicksand or Nunito)',
      'condensed': 'a tall condensed block font for maximum impact',
    };
    const colorDescriptions: Record<string, string> = {
      white: 'pure white',
      black: 'deep black',
      yellow: 'vibrant yellow',
      red: 'bold red',
      pink: 'hot pink',
      blue: 'electric blue',
      green: 'lime green',
      orange: 'bright orange',
    };
    const overlayDescriptions: Record<string, string> = {
      'none': 'no background behind the text — let it sit directly on the image',
      'solid-band': 'a solid colored horizontal band/box behind the text',
      'semi-dark': 'a semi-transparent dark tinted layer behind the text for readability',
      'semi-light': 'a semi-transparent light tinted layer behind the text for readability',
      'gradient-bottom': 'a soft gradient that fades from the bottom of the image to make the text pop',
      'gradient-top': 'a soft gradient that fades from the top of the image to make the text pop',
    };
    const positionDescriptions: Record<string, string> = {
      top: 'at the TOP of the composition (well within the safe-zone)',
      middle: 'in the CENTER of the composition',
      bottom: 'at the BOTTOM of the composition (well within the safe-zone)',
      infront: 'IN FRONT of the main subject, overlapping it boldly so the text reads on top of the product/person',
      behind: 'BEHIND the main subject — the text sits as a background layer with the subject occluding part of it for a layered, magazine-style depth effect',
    };

    const c = customization || {};
    const fontDesc = fontDescriptions[c.fontFamily] || fontDescriptions['bold-sans'];
    const textColorDesc = colorDescriptions[c.textColor] || 'pure white';
    const positionDesc = positionDescriptions[c.textPosition] || positionDescriptions.middle;
    const overlayDesc = overlayDescriptions[c.overlayStyle] || overlayDescriptions.none;
    const overlayColorDesc = c.overlayStyle && c.overlayStyle !== 'none'
      ? `Use ${colorDescriptions[c.overlayColor] || 'black'} for the overlay/background color. `
      : '';
    const themeDesc = c.themePrompt && c.themePrompt.trim().length > 0
      ? `Additional vibe/theme to incorporate: "${String(c.themePrompt).slice(0, 200)}". `
      : '';

    const customizationFragment = ` Render the headline text in ${fontDesc}, colored ${textColorDesc}, positioned ${positionDesc}. ${overlayDesc ? `Use ${overlayDesc}. ` : ''}${overlayColorDesc}${themeDesc}`;

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
    
    // === AI generates a CLEAN background image (no text). ===
    // All text/animation is added by Shotstack so we get real motion design.
    const themeDesc = customization?.themePrompt && customization.themePrompt.trim().length > 0
      ? ` Vibe/theme: "${String(customization.themePrompt).slice(0, 200)}".`
      : '';

    const styleMoodMap: Record<string, string> = {
      boom: 'high-energy, vibrant, punchy commercial advertising lighting',
      sparkle: 'magical, dreamy, soft glowing studio lighting with bokeh',
      stars: 'glamorous, fashion-magazine, premium product lighting',
      minimal: 'clean, minimal, editorial product photography on a soft neutral backdrop',
    };
    const moodDesc = styleMoodMap[style] || styleMoodMap.boom;

    const cleanBgPrompt = (orientation: 'portrait' | 'landscape') => {
      const dims = orientation === 'portrait' ? '1080x1920 vertical (9:16)' : '1920x1080 horizontal (16:9)';
      const composition = orientation === 'portrait'
        ? 'Compose with the subject in the LOWER HALF of the frame so the upper half stays clear for animated text overlay.'
        : 'Compose with the subject on ONE SIDE (left or right) so the opposite half stays clear for animated text overlay.';
      return `Take this product photo and transform it into a beautiful, hero-quality promotional BACKGROUND image in ${dims} format. Use ${moodDesc}.${themeDesc}

CRITICAL RULES:
- Do NOT add any text, words, letters, numbers, prices, or typography of any kind. Zero text. The image must be purely visual.
- Do NOT add badges, stickers, price tags, "sale" labels, or any callout graphics.
- ${composition}
- Make the product look mouth-watering / desirable, with rich lighting and styling.
- Keep the background relatively clean and uncluttered (it will have animated text placed over it).
- Output only the styled hero photo. Nothing else.`;
    };

    const textPrompt = cleanBgPrompt('portrait');
    const landscapePrompt = cleanBgPrompt('landscape');

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

    let landscapeImageBase64 = null;
    if (landscapeAiResponse.ok) {
      const landscapeData = await landscapeAiResponse.json();
      landscapeImageBase64 = landscapeData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      console.log('Landscape image generated:', !!landscapeImageBase64);
    } else {
      console.log('Landscape generation failed, continuing with portrait only');
    }

    console.log('Promotional images generated, uploading to storage...');
    const timestamp = Date.now();

    const portraitBase64Data = portraitImageBase64.split(',')[1];
    const portraitBinaryData = Uint8Array.from(atob(portraitBase64Data), c => c.charCodeAt(0));
    const portraitImagePath = `promo-images/${timestamp}-portrait.png`;
    
    const uploadPromises: Promise<{ data: unknown; error: { message?: string } | null }>[] = [
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

    // ============================================================
    // SHOTSTACK MULTI-SCENE PROMO
    // Scene 1 (full duration): Ken Burns background + dim overlay
    // Scene 2 (~20% in): Title slides up + fades in, holds
    // Scene 3 (~45% in): Price pops in (zoom) with accent badge, holds
    // Scene 4 (~70% in, OPTIONAL): Pulsing "TODAY ONLY" badge
    // ============================================================
    const videoDuration = Math.max(5, Math.min(30, parseFloat(duration) || 8));

    const titleStart = videoDuration * 0.20;
    const priceStart = videoDuration * 0.45;
    const badgeStart = videoDuration * 0.70;

    const accentColor = '#FACC15';
    const accentInk = '#111111';
    const titleInk = '#FFFFFF';

    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const titleHtmlFor = (text: string, fontSize: number) => `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:${fontSize}px;color:${titleInk};letter-spacing:-0.01em;line-height:1.05;text-align:center;text-shadow:0 4px 24px rgba(0,0,0,0.55);padding:0 40px;">${escapeHtml(text)}</div>
    </div>`;

    const priceHtmlFor = (text: string, fontSize: number) => `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
      <div style="display:inline-block;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:${fontSize}px;color:${accentInk};background:${accentColor};letter-spacing:-0.02em;padding:18px 44px;border-radius:18px;box-shadow:0 14px 50px rgba(0,0,0,0.45);text-transform:uppercase;">${escapeHtml(text)}</div>
    </div>`;

    const badgeHtmlFor = (text: string) => `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:42px;color:#FFFFFF;background:#DC2626;letter-spacing:0.08em;padding:14px 28px;border-radius:9999px;box-shadow:0 10px 30px rgba(220,38,38,0.5);text-transform:uppercase;border:3px solid #FFFFFF;">${escapeHtml(text)}</div>
    </div>`;

    const dimOverlayHtml = `<div style="width:100%;height:100%;background:linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.20) 50%, rgba(0,0,0,0.55) 100%);"></div>`;

    const buildTracks = (imageSrc: string, isPortrait: boolean) => {
      const titleFontSize = isPortrait ? 96 : 84;
      const priceFontSize = isPortrait ? 140 : 120;
      const titleWidth = isPortrait ? 1000 : 1500;
      const titleHeight = isPortrait ? 360 : 260;
      const priceWidth = isPortrait ? 900 : 1100;
      const priceHeight = isPortrait ? 280 : 240;
      const badgeWidth = isPortrait ? 600 : 600;
      const badgeHeight = 120;

      const titleY = isPortrait ? 0.18 : 0.22;
      const priceY = isPortrait ? -0.12 : -0.10;
      const badgeY = isPortrait ? -0.38 : -0.36;

      const tracks: Record<string, unknown>[] = [];

      // BG image with slow Ken Burns
      tracks.push({
        clips: [{
          asset: { type: "image", src: imageSrc },
          start: 0,
          length: videoDuration,
          fit: "cover",
          effect: "zoomIn",
          transition: { in: "fade", out: "fade" }
        }]
      });

      // Dim overlay so text reads on any background
      tracks.push({
        clips: [{
          asset: { type: "html", html: dimOverlayHtml, width: isPortrait ? 1080 : 1920, height: isPortrait ? 1920 : 1080 },
          start: 0,
          length: videoDuration,
          position: "center",
        }]
      });

      // Title slides up and fades in
      if (titleText) {
        tracks.push({
          clips: [{
            asset: { type: "html", html: titleHtmlFor(titleText, titleFontSize), width: titleWidth, height: titleHeight },
            start: titleStart,
            length: videoDuration - titleStart,
            position: "center",
            offset: { x: 0, y: titleY },
            transition: { in: "slideUp", out: "fade" }
          }]
        });
      }

      // Price pops in with zoom
      if (priceText) {
        tracks.push({
          clips: [{
            asset: { type: "html", html: priceHtmlFor(priceText, priceFontSize), width: priceWidth, height: priceHeight },
            start: priceStart,
            length: videoDuration - priceStart,
            position: "center",
            offset: { x: 0, y: priceY },
            transition: { in: "zoom", out: "fade" },
            effect: "zoomInSlow"
          }]
        });
      }

      // Optional pulsing "TODAY ONLY" badge
      if (showBadge && finalBadgeText) {
        const pulseLen = 1.0;
        let t = badgeStart;
        let toggle = true;
        while (t + pulseLen <= videoDuration) {
          const clip: Record<string, unknown> = {
            asset: { type: "html", html: badgeHtmlFor(finalBadgeText), width: badgeWidth, height: badgeHeight },
            start: t,
            length: pulseLen,
            position: "center",
            offset: { x: 0, y: badgeY },
            effect: toggle ? "zoomIn" : "zoomOut",
          };
          if (t === badgeStart) clip.transition = { in: "zoom" };
          tracks.push({ clips: [clip] });
          t += pulseLen;
          toggle = !toggle;
        }
      }

      return tracks;
    };

    const portraitEdit = {
      timeline: {
        background: "#000000",
        tracks: buildTracks(portraitImageUrl, true)
      },
      output: {
        format: "mp4",
        aspectRatio: "9:16",
        size: { width: 1080, height: 1920 },
        fps: 30
      }
    };

    const landscapeEdit = landscapeImageUrl ? {
      timeline: {
        background: "#000000",
        tracks: buildTracks(landscapeImageUrl, false)
      },
      output: {
        format: "mp4",
        aspectRatio: "16:9",
        size: { width: 1920, height: 1080 },
        fps: 30
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
    const videoData: Record<string, string | null> = {
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
