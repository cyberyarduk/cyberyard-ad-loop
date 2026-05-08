import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Per-caller rate limiter (10 / hour). Keyed by Authorization header or device token.
const rlAttempts = new Map<string, number[]>();
const RL_WINDOW = 60 * 60 * 1000;
const RL_MAX = 10;
function rateLimited(key: string): boolean {
  const now = Date.now();
  const list = (rlAttempts.get(key) || []).filter((t) => now - t < RL_WINDOW);
  if (list.length >= RL_MAX) { rlAttempts.set(key, list); return true; }
  list.push(now); rlAttempts.set(key, list); return false;
}

const isHttpsTrustedUrl = (u: string): boolean => {
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') return false;
    // Allow Supabase Storage and lovable-uploads hosts; otherwise reject to prevent SSRF.
    const allowed = [
      '.supabase.co',
      '.supabase.in',
      'lovable-uploads.s3.amazonaws.com',
      'cdn.shotstack.io',
      'images.unsplash.com',
      'plus.unsplash.com',
    ];
    return allowed.some((d) => url.hostname.endsWith(d) || url.hostname === d.replace(/^\./, ''));
  } catch { return false; }
};

const InputSchema = z.object({
  imageUrl: z.string().url().max(2048).optional().refine((u) => !u || isHttpsTrustedUrl(u), {
    message: 'imageUrl must be HTTPS from a trusted host',
  }),
  imageUrlLandscape: z.string().url().max(2048).optional().refine((u) => !u || isHttpsTrustedUrl(u), {
    message: 'imageUrlLandscape must be HTTPS from a trusted host',
  }),
  imageData: z.string().max(10_000_000).optional(), // ~7.5MB raw after base64 decode
  mainText: z.string().max(120).optional(),
  subtext: z.string().max(120).optional(),
  price: z.string().max(40).optional(),
  duration: z.union([z.number(), z.string()]).optional(),
  style: z.enum(['boom', 'sparkle', 'stars', 'minimal']).optional(),
  playlistId: z.string().uuid().optional(),
  deviceToken: z.string().min(16).max(256).optional(),
  customization: z.record(z.any()).optional(),
  limitedOffer: z.boolean().optional(),
  badgeText: z.string().max(40).optional(),
  animatedOverlays: z.boolean().optional(),
  overlayAnimation: z.enum(['none', 'shine', 'pulse-border', 'sparkles', 'corner-burst', 'spotlight', 'zoom-rings', 'confetti', 'neon-flicker', 'color-pulse']).optional(),
  useImageAsIs: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rlKey = req.headers.get('authorization') || req.headers.get('x-device-token') || 'anon';
    if (rateLimited(rlKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before generating more videos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const raw = await req.json().catch(() => ({}));
    const parsedInput = InputSchema.safeParse(raw);
    if (!parsedInput.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsedInput.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { imageUrl, imageUrlLandscape, imageData, mainText, subtext, duration, style = 'boom', playlistId, deviceToken, customization, price, limitedOffer, badgeText, animatedOverlays = true, overlayAnimation, useImageAsIs = false } = parsedInput.data;
    // Resolve which animated overlay to render. Default is "shine" — a
    // subtle eye-catcher. Old "bars" requests are silently upgraded to shine.
    const requestedOverlay = (overlayAnimation === 'bars' ? 'shine' : overlayAnimation);
    const overlayKind: string = requestedOverlay ?? (animatedOverlays ? 'shine' : 'none');
    console.log('Generating video with params:', { hasImageUrl: !!imageUrl, hasImageUrlLandscape: !!imageUrlLandscape, hasImageData: !!imageData, mainText, subtext, duration, style, playlistId, deviceToken: !!deviceToken, customization, price, limitedOffer, badgeText, animatedOverlays, useImageAsIs });

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
    // STEP 1 — Get the hero poster image(s).
    //
    // Two paths:
    //   (a) useImageAsIs = true  → skip Gemini, use the uploaded image
    //                              directly as the hero (e.g. menu uploads
    //                              that just want animated overlays on top
    //                              of their existing artwork).
    //   (b) useImageAsIs = false → ask Gemini to bake a full promo poster
    //                              (image + headline + price + design) —
    //                              the "Blueberry Muffins 50% off" look.
    // ============================================================
    let portraitImageUrl: string;
    let landscapeImageUrl: string | null;

    if (useImageAsIs) {
      console.log('Skipping Gemini — using uploaded image as the hero poster');
      portraitImageUrl = finalImageUrl;
      landscapeImageUrl = imageUrlLandscape || finalImageUrl;
    } else {
      const fontDescriptions: Record<string, string> = {
        'bold-sans': 'a bold heavy sans-serif font (like Impact or Bebas Neue)',
        'elegant-serif': 'an elegant serif font (like Playfair Display or Didot)',
        'handwritten': 'a handwritten brush-script font with personality',
        'modern-display': 'a modern geometric display font (like Futura or Eurostile)',
        'rounded': 'a rounded soft friendly font (like Quicksand or Nunito)',
        'condensed': 'a tall condensed block font for maximum impact',
      };
      const colorDescriptions: Record<string, string> = {
        white: 'pure white', black: 'deep black', yellow: 'vibrant yellow',
        red: 'bold red', pink: 'hot pink', blue: 'electric blue',
        green: 'lime green', orange: 'bright orange',
      };
      const overlayDescriptions: Record<string, string> = {
        'none': 'no background behind the text — let it sit directly on the image',
        'solid-band': 'a solid coloured horizontal band/box behind the text',
        'semi-dark': 'a semi-transparent dark tinted layer behind the text for readability',
        'semi-light': 'a semi-transparent light tinted layer behind the text for readability',
        'gradient-bottom': 'a soft gradient that fades from the bottom of the image to make the text pop',
        'gradient-top': 'a soft gradient that fades from the top of the image to make the text pop',
      };
      const positionDescriptions: Record<string, string> = {
        top: 'in the empty space ABOVE the product (never overlapping it)',
        middle: 'in clear empty space beside the product, never covering or touching it',
        bottom: 'in the empty space BELOW the product (never overlapping it)',
        // "infront" intentionally maps to a safe placement — text must NEVER cover the product.
        infront: 'in clear empty space beside the product, never covering or touching it',
        behind: 'subtly integrated BEHIND the product for depth (product stays fully visible in front)',
      };
      const c = customization || {};
      const fontDesc = fontDescriptions[c.fontFamily as string] || fontDescriptions['bold-sans'];
      const textColorDesc = colorDescriptions[c.textColor as string] || 'pure white';
      const positionDesc = positionDescriptions[c.textPosition as string] || positionDescriptions.middle;
      const overlayDesc = overlayDescriptions[c.overlayStyle as string] || overlayDescriptions.none;
      const overlayColorDesc = c.overlayStyle && c.overlayStyle !== 'none'
        ? `Use ${colorDescriptions[c.overlayColor as string] || 'black'} for the overlay/background colour. `
        : '';
      const themeDesc = c.themePrompt && String(c.themePrompt).trim().length > 0
        ? `Additional vibe/theme to incorporate: "${String(c.themePrompt).slice(0, 200)}". `
        : '';
      const customizationFragment = ` Render the headline text in ${fontDesc}, coloured ${textColorDesc}, positioned ${positionDesc}. ${overlayDesc ? `Use ${overlayDesc}. ` : ''}${overlayColorDesc}${themeDesc}`;

      const headline = titleText;
      const priceLine = priceText ? ` Include a large, bold price callout "${priceText}" in a contrasting accent colour.` : '';
      const badgeLine = (showBadge && finalBadgeText)
        ? ` Add a small "${finalBadgeText}" badge/sticker in a corner.`
        : '';

      // CRITICAL composition rule appended to every prompt: the product must
      // remain fully visible. Text must NEVER overlap or cover the product —
      // it sits above, below, beside, or softly behind it.
      const PRODUCT_RULE = ' CRITICAL: Keep the product fully visible and unobstructed. Text and price callouts must NEVER cover, overlap or sit on top of the product — place them in empty space above, below or beside the product so the product itself is never hidden.';

      const stylePrompts: Record<string, (orientation: string) => string> = {
        boom: (o) => `Take this product image and transform it into an eye-catching promotional poster in ${o} format. Add bold explosive text "${headline}" in huge letters with vibrant red and pink gradients, dramatic shadows, and energy-burst effects. Make it look like a dramatic product advertisement with WOW factor.${priceLine}${badgeLine}`,
        sparkle: (o) => `Take this product image and transform it into a magical promotional poster in ${o} format. Add elegant text "${headline}" with purple-to-blue gradients, sparkles, and dreamy glowing effects. Make it enchanting and eye-catching.${priceLine}${badgeLine}`,
        stars: (o) => `Take this product image and transform it into a glamorous promotional poster in ${o} format. Add stylish text "${headline}" with hot pink colours, star decorations, and dazzling celebrity-style effects. Make it fabulous and attention-grabbing.${priceLine}${badgeLine}`,
        minimal: (o) => `Take this product image and transform it into a clean modern promotional poster in ${o} format. Add modern text "${headline}" in bold sans-serif font with simple, professional styling. Keep it minimal but impactful.${priceLine}${badgeLine}`,
      };
      const stylefn = stylePrompts[style] || stylePrompts.boom;
      const portraitPrompt = stylefn('1080x1920 portrait') + customizationFragment + PRODUCT_RULE;
      const landscapePrompt = stylefn('1920x1080 landscape') + customizationFragment + PRODUCT_RULE;

      const callGemini = (prompt: string) => fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: finalImageUrl } }
            ]
          }],
          modalities: ['image', 'text']
        })
      });

      const extractB64 = async (res: Response, label: string): Promise<string | null> => {
        if (!res.ok) { console.error(`${label} AI error:`, await res.text().catch(() => '')); return null; }
        try {
          const json = await res.json();
          return json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
        } catch { return null; }
      };

      // Run portrait + landscape SEQUENTIALLY (not in parallel) so we don't
      // hammer Gemini with two simultaneous image-generation requests — that
      // was triggering 429 rate-limits and silently falling back to the
      // original uploaded image (which is why desktop/landscape kept
      // appearing as the raw upload with no text).
      console.log('Generating portrait promo poster with Gemini...');
      const portraitRes = await callGemini(portraitPrompt);
      let portraitB64 = await extractB64(portraitRes, 'portrait poster');

      // Small spacing + one retry for portrait if it failed.
      if (!portraitB64) {
        console.warn('Portrait poster failed once — retrying after short delay');
        await new Promise(r => setTimeout(r, 1500));
        const retry = await callGemini(portraitPrompt);
        portraitB64 = await extractB64(retry, 'portrait poster (retry)');
      }

      await new Promise(r => setTimeout(r, 800));

      console.log('Generating landscape promo poster with Gemini...');
      const landscapeRes = await callGemini(landscapePrompt);
      let landscapeB64 = await extractB64(landscapeRes, 'landscape poster');

      // Retry landscape once if it failed — this is the bug that caused
      // desktop renders to fall back to the original raw image.
      if (!landscapeB64) {
        console.warn('Landscape poster failed once — retrying after short delay');
        await new Promise(r => setTimeout(r, 2000));
        const retry = await callGemini(landscapePrompt);
        landscapeB64 = await extractB64(retry, 'landscape poster (retry)');
      }

      const ts = Date.now();
      const uploadPng = async (b64: string, path: string) => {
        const data = b64.split(',')[1];
        const bin = Uint8Array.from(atob(data), ch => ch.charCodeAt(0));
        const { error } = await supabase.storage.from('videos').upload(path, bin, {
          contentType: 'image/png', upsert: false, cacheControl: '31536000',
        });
        if (error) throw new Error(`Upload failed (${path}): ${error.message}`);
        return supabase.storage.from('videos').getPublicUrl(path).data.publicUrl;
      };

      // Graceful fallback: if Gemini failed (rate-limit / transient), use the
      // original uploaded image as the hero so the render still produces a
      // playable video instead of crashing the whole request.
      if (!portraitB64) {
        console.warn('Gemini portrait poster failed — falling back to original uploaded image');
        portraitImageUrl = finalImageUrl;
      } else {
        portraitImageUrl = await uploadPng(portraitB64, `promo-images/${ts}-portrait.png`);
      }

      if (landscapeB64) {
        landscapeImageUrl = await uploadPng(landscapeB64, `promo-images/${ts}-landscape.png`);
      } else {
        console.warn('Gemini landscape poster failed — falling back to uploaded image');
        landscapeImageUrl = imageUrlLandscape || finalImageUrl;
      }
      console.log('Hero posters ready:', { portraitImageUrl, landscapeImageUrl });
    }

    // ============================================================
    // STEP 2 — Animate the finished AI poster in Shotstack.
    // The poster is the hero. We add: slow Ken Burns + a coloured
    // accent bar that swipes across the screen + optional pulsing
    // limited-offer badge overlay.
    // ============================================================
    const videoDuration = Math.max(6, Math.min(30, parseFloat(duration) || 8));

    const ACCENT_BY_STYLE: Record<string, string> = {
      boom: '#FF3B30', sparkle: '#A855F7', stars: '#FF2D87', minimal: '#0A84FF',
    };
    const accent = ACCENT_BY_STYLE[style] || '#FACC15';

    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const buildTracks = (posterUrl: string, isPortrait: boolean) => {
      const W = isPortrait ? 1080 : 1920;
      const H = isPortrait ? 1920 : 1080;
      const tracks: Record<string, unknown>[] = [];

      // NOTE: The pulsing red corner badge overlay was removed — it covered
      // the AI poster text and looked cheap. The "limited offer" stamp is
      // now baked directly into the AI-generated poster image instead.

      // Animated overlay — choice of motion effect on top of the poster.
      // Skipped entirely when "none".
      if (overlayKind === 'spotlight') {
        // Soft moving radial light that drifts across the poster — pulls
        // the eye without obscuring the artwork.
        const spotSize = Math.round(Math.min(W, H) * 0.65);
        const spotHtml = `<div class="spot"></div>`;
        const spotCss = `.spot{width:${spotSize}px;height:${spotSize}px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0) 70%);animation:drift ${Math.max(6, videoDuration)}s ease-in-out infinite;}@keyframes drift{0%{transform:translate(-25%,-15%)}50%{transform:translate(25%,15%)}100%{transform:translate(-25%,-15%)}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html: spotHtml, css: spotCss, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'zoom-rings') {
        // Concentric rings rippling out from the centre — strong attention grabber.
        const ringHtml = `<div class="r r1"></div><div class="r r2"></div><div class="r r3"></div>`;
        const ringCss = `.r{position:absolute;left:50%;top:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border:4px solid ${accent};border-radius:50%;opacity:0;animation:ring 2.4s ease-out infinite;box-shadow:0 0 30px ${accent};}.r2{animation-delay:0.8s}.r3{animation-delay:1.6s}@keyframes ring{0%{transform:scale(0.4);opacity:0.9}100%{transform:scale(8);opacity:0}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html: `<div style="position:relative;width:${W}px;height:${H}px">${ringHtml}</div>`, css: ringCss, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'confetti') {
        // Falling colourful specks — celebratory, perfect for offers.
        const colors = ['#FF3B30', '#FFD60A', '#30D158', '#0A84FF', '#FF2D87', '#FFFFFF'];
        const pieces = Array.from({ length: 22 }).map((_, i) => ({
          x: Math.random() * 100,
          delay: (Math.random() * 3).toFixed(2),
          dur: (3 + Math.random() * 3).toFixed(2),
          color: colors[i % colors.length],
          size: 8 + Math.round(Math.random() * 8),
        }));
        const dots = pieces.map((_, i) => `<span class="c c${i}"></span>`).join('');
        const cssPieces = pieces.map((p, i) =>
          `.c${i}{left:${p.x}%;width:${p.size}px;height:${p.size}px;background:${p.color};animation-delay:${p.delay}s;animation-duration:${p.dur}s;}`
        ).join('');
        const html = `<div class="wrap">${dots}</div>`;
        const css = `.wrap{position:relative;width:${W}px;height:${H}px;overflow:hidden;}.c{position:absolute;top:-20px;border-radius:2px;animation:fall linear infinite;}@keyframes fall{0%{transform:translateY(-40px) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translateY(${H + 40}px) rotate(540deg);opacity:0.8}}${cssPieces}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html, css, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'neon-flicker') {
        // Buzzing neon outline — like a shop sign at night.
        const bw = isPortrait ? 10 : 8;
        const html = `<div class="frame"></div>`;
        const css = `.frame{width:${W - bw * 2}px;height:${H - bw * 2}px;border:${bw}px solid ${accent};border-radius:6px;box-shadow:0 0 20px ${accent},0 0 50px ${accent},inset 0 0 20px ${accent};animation:flick 3.2s steps(1,end) infinite;}@keyframes flick{0%,18%,22%,25%,53%,57%,100%{opacity:1}19%,21%,55%{opacity:0.4}20%,56%{opacity:0.85}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html, css, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'color-pulse') {
        // Very gentle full-frame accent glow that breathes in and out.
        const html = `<div class="wash"></div>`;
        const css = `.wash{width:${W}px;height:${H}px;background:radial-gradient(ellipse at center, rgba(255,255,255,0) 40%, ${accent} 130%);mix-blend-mode:screen;opacity:0.0;animation:breath 3.6s ease-in-out infinite;}@keyframes breath{0%,100%{opacity:0.0}50%{opacity:0.55}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html, css, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      }
        // Single big diagonal light sweep across the whole frame.
        const shineW = Math.round(W * 0.35);
        const shineHtml = `<div class="shine"></div>`;
        const shineCss = `.shine{width:${shineW}px;height:${H * 1.4}px;background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,0.25) 45%,rgba(255,255,255,0.65) 50%,rgba(255,255,255,0.25) 55%,transparent 100%);transform:skewX(-15deg);}`;
        const sweepStarts = [0.6, videoDuration * 0.55].filter(s => s + 2 <= videoDuration);
        for (const start of sweepStarts) {
          tracks.push({
            clips: [{
              asset: { type: 'html', html: shineHtml, css: shineCss, width: shineW, height: H, background: 'transparent' },
              start,
              length: 2,
              position: 'center',
              transition: { in: 'slideRight', out: 'slideRight' },
            }]
          });
        }
      } else if (overlayKind === 'pulse-border') {
        // Pulsing accent frame around the whole edge.
        const borderW = isPortrait ? 14 : 12;
        const borderHtml = `<div class="frame"></div>`;
        const borderCss = `.frame{width:${W - borderW * 2}px;height:${H - borderW * 2}px;border:${borderW}px solid ${accent};box-shadow:0 0 60px ${accent},inset 0 0 60px ${accent};animation:pulse 1.4s ease-in-out infinite;}@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html: borderHtml, css: borderCss, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'sparkles') {
        // Twinkling star particles scattered across the frame.
        const points = Array.from({ length: 14 }).map(() => ({
          x: Math.random() * 100, y: Math.random() * 100,
          delay: (Math.random() * 2).toFixed(2),
          size: 18 + Math.round(Math.random() * 18),
        }));
        const dots = points.map((p, i) => `<span class="s s${i}">★</span>`).join('');
        const cssPoints = points.map((p, i) =>
          `.s${i}{left:${p.x}%;top:${p.y}%;font-size:${p.size}px;animation-delay:${p.delay}s;}`
        ).join('');
        const sparkHtml = `<div class="wrap">${dots}</div>`;
        const sparkCss = `.wrap{position:relative;width:${W}px;height:${H}px;}.s{position:absolute;color:#FFD24A;text-shadow:0 0 20px rgba(255,210,74,0.9);opacity:0;transform:translate(-50%,-50%) scale(0.4);animation:tw 2.4s ease-in-out infinite;}@keyframes tw{0%,100%{opacity:0;transform:translate(-50%,-50%) scale(0.4)}50%{opacity:1;transform:translate(-50%,-50%) scale(1)}}${cssPoints}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html: sparkHtml, css: sparkCss, width: W, height: H, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'center',
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      } else if (overlayKind === 'corner-burst') {
        // Flashing radial glow in the top-right corner.
        const burstSize = Math.round(Math.min(W, H) * 0.55);
        const burstHtml = `<div class="burst"></div>`;
        const burstCss = `.burst{width:${burstSize}px;height:${burstSize}px;border-radius:50%;background:radial-gradient(circle,${accent} 0%,rgba(0,0,0,0) 70%);animation:flash 1.6s ease-in-out infinite;}@keyframes flash{0%,100%{opacity:0.25;transform:scale(0.85)}50%{opacity:0.9;transform:scale(1.05)}}`;
        tracks.push({
          clips: [{
            asset: { type: 'html', html: burstHtml, css: burstCss, width: burstSize, height: burstSize, background: 'transparent' },
            start: 0,
            length: videoDuration,
            position: 'topRight',
            offset: { x: 0.04, y: -0.04 },
            transition: { in: 'fade', out: 'fade' },
          }]
        });
      }

      // HERO POSTER — the AI-generated promo image with slow Ken Burns.
      // No in-fade so the FIRST frame is the finished poster (gives us a
      // clean preview thumbnail in the media library and avoids a black flash).
      tracks.push({
        clips: [{
          asset: { type: 'image', src: posterUrl },
          start: 0,
          length: videoDuration,
          fit: 'cover',
          effect: 'zoomInSlow',
          transition: { out: 'fade' },
        }]
      });

      return tracks;
    };

    const portraitEdit = {
      timeline: { background: '#000000', tracks: buildTracks(portraitImageUrl, true) },
      output: { format: 'mp4', aspectRatio: '9:16', size: { width: 1080, height: 1920 }, fps: 30 }
    };

    const landscapeEdit = landscapeImageUrl ? {
      timeline: { background: '#000000', tracks: buildTracks(landscapeImageUrl, false) },
      output: { format: 'mp4', aspectRatio: '16:9', size: { width: 1920, height: 1080 }, fps: 30 }
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

    // Insert video record. We also save the portrait promo poster as
    // `image_url` so the media library can use it as a <video poster>
    // thumbnail (otherwise the first frame can flash black).
    const videoData: Record<string, string | null> = {
      title: mainText || 'AI Generated Video',
      video_url: videoUrl,
      user_id: userId,
      company_id: companyId,
      source: 'ai_generated',
      ai_prompt: mainText,
      ai_style: style,
      ai_duration: duration,
      ai_image_url: finalImageUrl,
      image_url: portraitImageUrl,
      image_url_landscape: landscapeImageUrl ?? null,
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
