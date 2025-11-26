import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('x-device-token');
    const { pin } = await req.json();

    console.log('PIN check request, token present:', !!authToken);

    if (!authToken) {
      throw new Error('Device authentication token required');
    }

    if (!pin) {
      throw new Error('PIN is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find device by auth token
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, admin_pin, company_id')
      .eq('auth_token', authToken)
      .eq('status', 'active')
      .single();

    if (deviceError || !device) {
      console.error('Device not found:', deviceError);
      throw new Error('Invalid device');
    }

    // Check PIN (simple string comparison for now)
    const isValid = device.admin_pin === pin;

    console.log('PIN check for device:', device.id, 'Valid:', isValid);

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
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
