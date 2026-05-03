import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token',
};

// In-memory rate limiter (per device, per process). 5 attempts / 15 min.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ATTEMPTS) {
    attempts.set(key, list);
    return true;
  }
  list.push(now);
  attempts.set(key, list);
  return false;
}

const BodySchema = z.object({
  pin: z.string().min(4).max(12).regex(/^[0-9]+$/, "PIN must be numeric"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('x-device-token');
    if (!authToken || authToken.length < 16 || authToken.length > 256) {
      throw new Error('Device authentication token required');
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { pin } = parsed.data;

    if (rateLimited(authToken)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many attempts. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, admin_pin, company_id')
      .eq('auth_token', authToken)
      .eq('status', 'active')
      .single();

    if (deviceError || !device) {
      throw new Error('Invalid device');
    }

    // Verify against hashed PIN (handles legacy plaintext fallback safely)
    let isValid = false;
    if (device.admin_pin) {
      if (device.admin_pin.startsWith('$2')) {
        const { data: ok } = await supabase.rpc('verify_pin', {
          pin,
          hashed_pin: device.admin_pin,
        });
        isValid = !!ok;
      } else {
        // Legacy unhashed value — compare directly, then upgrade to hash.
        isValid = device.admin_pin === pin;
        if (isValid) {
          await supabase.from('devices').update({ admin_pin: pin }).eq('id', device.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        valid: isValid,
        device_id: device.id,
        company_id: device.company_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PIN check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
