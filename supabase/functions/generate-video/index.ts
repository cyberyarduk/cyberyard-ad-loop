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

    // (Old AI-text customization block removed — text is now rendered by Shotstack, not the AI image.)


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

    // ============================================================
    // SIMPLE, RELIABLE APPROACH
    // The user's uploaded image IS the advert background.
    // No AI cutout (was producing white-box rectangles).
    // No AI background replacement (was replacing the actual product).
    // Shotstack adds: slow Ken Burns motion + dim overlay + animated text.
    // ============================================================
    console.log('Using uploaded image directly as advert background.');

    const portraitImageUrl = finalImageUrl;
    const landscapeImageUrl = finalImageUrl;

    // ============================================================
    // SHOTSTACK MULTI-SCENE PROMO
    // Scene 1 (full duration): Ken Burns background + dim overlay
    // Scene 2 (~20% in): Title slides up + fades in, holds
    // Scene 3 (~45% in): Price pops in (zoom) with accent badge, holds
    // Scene 4 (~70% in, OPTIONAL): Pulsing "TODAY ONLY" badge
    // ============================================================
    const videoDuration = Math.max(6, Math.min(30, parseFloat(duration) || 10));

    // Slower, more deliberate timing — text appears earlier and HOLDS longer.
    const titleStart = 0.6;
    const priceStart = videoDuration * 0.30;
    const badgeStart = videoDuration * 0.55;

    const accentColor = '#FACC15';
    const accentInk = '#111111';
    const titleInk = '#FFFFFF';

    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Try to split "Bacon Sandwich Only £4.99" -> title="Bacon Sandwich Only", price="£4.99"
    let resolvedTitle = titleText;
    let resolvedPrice = priceText;
    if (!resolvedPrice && resolvedTitle) {
      const m = resolvedTitle.match(/(.+?)\s+((?:£|\$|€)\s?\d[\d.,]*|\d+\s?p\b|\d+%\s?off)\s*$/i);
      if (m) {
        resolvedTitle = m[1].trim();
        resolvedPrice = m[2].trim();
      }
    }

    // Auto-shrink title font if the text is long so it always fits on screen.
    const titleLen = resolvedTitle.length;
    const titleSizeKey: 'medium' | 'large' | 'x-large' =
      titleLen > 32 ? 'medium' : titleLen > 18 ? 'large' : 'x-large';

    const buildTracks = (bgSrc: string, isPortrait: boolean) => {
      const W = isPortrait ? 1080 : 1920;
      const H = isPortrait ? 1920 : 1080;

      // Layout: title TOP, price CENTER-BOTTOM, badge TOP-RIGHT-ish above title.
      const titleY = isPortrait ? 0.36 : 0.34;
      const priceY = isPortrait ? -0.30 : -0.30;
      const badgeY = isPortrait ? 0.44 : 0.42;

      // Smaller, safer font sizes that always fit in the canvas.
      const priceFontSize = isPortrait ? 140 : 120;
      const badgeFontSize = isPortrait ? 44 : 40;

      // IMPORTANT: in Shotstack, the FIRST track in the array renders ON TOP.
      // Order: badge -> price -> title -> dim overlay -> background image.
      const tracks: Record<string, unknown>[] = [];

      // BADGE — pulsing limited offer pill
      if (showBadge && finalBadgeText) {
        const badgeHtml = `<p class="b">${escapeHtml(finalBadgeText)}</p>`;
        const badgeCss = `.b{font-family:'Open Sans',Arial,sans-serif;font-weight:900;font-size:${badgeFontSize}px;color:#FFFFFF;background:#DC2626;letter-spacing:0.08em;padding:14px 32px;border-radius:9999px;display:inline-block;text-align:center;text-transform:uppercase;margin:0;line-height:1;border:3px solid #FFFFFF;box-shadow:0 6px 20px rgba(220,38,38,0.5);}`;
        const badgeW = 700;
        const badgeH = 140;
        const pulseLen = 0.9;
        let t = badgeStart;
        let toggle = true;
        while (t + pulseLen <= videoDuration) {
          const clip: Record<string, unknown> = {
            asset: { type: "html", html: badgeHtml, css: badgeCss, width: badgeW, height: badgeH, background: "transparent" },
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

      // PRICE — yellow pop badge, lower portion
      if (resolvedPrice) {
        const priceHtml = `<p class="p">${escapeHtml(resolvedPrice)}</p>`;
        const priceCss = `.p{font-family:'Open Sans',Arial,sans-serif;font-weight:900;font-size:${priceFontSize}px;color:${accentInk};background:${accentColor};letter-spacing:-0.02em;padding:20px 48px;border-radius:20px;display:inline-block;text-align:center;text-transform:uppercase;margin:0;line-height:1;box-shadow:0 12px 32px rgba(0,0,0,0.45);white-space:nowrap;}`;
        const priceW = isPortrait ? 900 : 1200;
        const priceH = isPortrait ? 280 : 240;
        tracks.push({
          clips: [{
            asset: { type: "html", html: priceHtml, css: priceCss, width: priceW, height: priceH, background: "transparent" },
            start: priceStart,
            length: Math.max(2, videoDuration - priceStart),
            position: "center",
            offset: { x: 0, y: priceY },
            transition: { in: "zoom", out: "fade" },
            effect: "zoomInSlow",
          }]
        });
      }

      // TITLE — top of frame
      if (resolvedTitle) {
        tracks.push({
          clips: [{
            asset: {
              type: "title",
              text: resolvedTitle,
              style: "future",
              color: titleInk,
              size: titleSizeKey,
              background: "transparent",
              position: "center",
            },
            start: titleStart,
            length: Math.max(2, videoDuration - titleStart),
            offset: { x: 0, y: titleY },
            transition: { in: "slideUp", out: "fade" },
          }]
        });
      }

      // Dim gradient overlay — stronger at top + bottom so text always reads.
      const dimHtml = `<div class="dim"></div>`;
      const dimCss = `.dim{width:100%;height:100%;background:linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 35%, rgba(0,0,0,0.10) 65%, rgba(0,0,0,0.65) 100%);}`;
      tracks.push({
        clips: [{
          asset: { type: "html", html: dimHtml, css: dimCss, width: W, height: H },
          start: 0,
          length: videoDuration,
          position: "center",
        }]
      });

      // BACKGROUND — the user's uploaded image with slow Ken Burns
      tracks.push({
        clips: [{
          asset: { type: "image", src: bgSrc },
          start: 0,
          length: videoDuration,
          fit: "cover",
          effect: "zoomInSlow",
          transition: { in: "fade", out: "fade" }
        }]
      });

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

    // ============================================================
    // PERSIST VIDEOS — Shotstack sandbox URLs expire (typically 24h),
    // so download the rendered MP4s and re-upload to our Supabase
    // storage bucket so they remain playable forever.
    // ============================================================
    const persistVideo = async (sourceUrl: string, label: string): Promise<string> => {
      try {
        console.log(`Downloading ${label} from Shotstack...`);
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          console.error(`${label} download failed: ${res.status}`);
          return sourceUrl; // fall back to Shotstack URL
        }
        const buf = new Uint8Array(await res.arrayBuffer());
        const path = `ai-renders/${Date.now()}-${crypto.randomUUID()}-${label}.mp4`;
        const { error } = await supabase.storage.from('videos').upload(path, buf, {
          contentType: 'video/mp4',
          upsert: false,
          cacheControl: '31536000',
        });
        if (error) {
          console.error(`${label} upload failed:`, error.message);
          return sourceUrl;
        }
        const publicUrl = supabase.storage.from('videos').getPublicUrl(path).data.publicUrl;
        console.log(`${label} persisted to:`, publicUrl);
        return publicUrl;
      } catch (e) {
        console.error(`${label} persist error:`, e);
        return sourceUrl;
      }
    };

    videoUrl = await persistVideo(videoUrl, 'portrait');
    if (videoUrlLandscape) {
      videoUrlLandscape = await persistVideo(videoUrlLandscape, 'landscape');
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
