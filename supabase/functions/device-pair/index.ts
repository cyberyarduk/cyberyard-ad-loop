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
    const { device_code, pairing_qr_token } = await req.json();
    console.log('Pairing attempt:', { device_code, pairing_qr_token });

    if (!device_code && !pairing_qr_token) {
      throw new Error('Either device_code or pairing_qr_token is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the device by code or token
    let query = supabase
      .from('devices')
      .select('*')
      .eq('status', 'unpaired');

    if (device_code) {
      query = query.eq('device_code', device_code.toUpperCase());
    } else {
      query = query.eq('pairing_qr_token', pairing_qr_token);
    }

    const { data: device, error: findError } = await query.single();

    if (findError || !device) {
      console.error('Device not found:', findError);
      throw new Error('Invalid pairing code or device already paired');
    }

    // Generate a secure auth token
    const auth_token = crypto.randomUUID() + crypto.randomUUID();

    // Update device to paired status
    const { data: updatedDevice, error: updateError } = await supabase
      .from('devices')
      .update({
        auth_token,
        status: 'active',
        last_seen_at: new Date().toISOString()
      })
      .eq('id', device.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating device:', updateError);
      throw new Error('Failed to complete pairing');
    }

    console.log('Device paired successfully:', updatedDevice.id);

    return new Response(
      JSON.stringify({
        success: true,
        auth_token,
        device_id: updatedDevice.id,
        company_id: updatedDevice.company_id,
        playlist_id: updatedDevice.playlist_id,
        device_name: updatedDevice.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pairing error:', error);
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
