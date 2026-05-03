import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Per-IP rate limiter: 10 / hour
const attempts = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 10;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ATTEMPTS) { attempts.set(ip, list); return true; }
  list.push(now); attempts.set(ip, list); return false;
}

const BodySchema = z.object({
  device_code: z.string().trim().min(4).max(12).regex(/^[A-Za-z0-9]+$/).optional(),
  pairing_qr_token: z.string().trim().min(16).max(128).regex(/^[A-Fa-f0-9]+$/).optional(),
}).refine((d) => !!d.device_code || !!d.pairing_qr_token, {
  message: "Either device_code or pairing_qr_token is required",
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many pairing attempts. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { device_code, pairing_qr_token } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase.from('devices').select('*');
    if (device_code) query = query.eq('device_code', device_code.toUpperCase());
    else query = query.eq('pairing_qr_token', pairing_qr_token!);

    const { data: device, error: findError } = await query.single();
    if (findError || !device) {
      throw new Error('Invalid pairing code');
    }

    // If the physical player crashed/refreshed and lost localStorage, allow it
    // to recover the existing token instead of being locked out as "already paired".
    if ((device.status === 'active' || device.status === 'suspended') && device.auth_token) {
      await supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', device.id);

      return new Response(
        JSON.stringify({
          success: true,
          recovered: true,
          auth_token: device.auth_token,
          device_id: device.id,
          company_id: device.company_id,
          playlist_id: device.playlist_id,
          device_name: device.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (device.status !== 'unpaired') {
      throw new Error('Device cannot be paired in its current state');
    }

    const auth_token = crypto.randomUUID() + crypto.randomUUID();

    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({ auth_token, status: 'active', last_seen_at: new Date().toISOString() })
      .eq('id', device.id)
      .select()
      .single();

    if (updateError) throw new Error('Failed to complete pairing');

    return new Response(
      JSON.stringify({
        success: true,
        auth_token,
        device_id: updatedDevice.id,
        company_id: updatedDevice.company_id,
        playlist_id: updatedDevice.playlist_id,
        device_name: updatedDevice.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pairing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
