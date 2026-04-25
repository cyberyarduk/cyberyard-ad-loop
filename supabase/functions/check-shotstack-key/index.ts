import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const key = Deno.env.get('SHOTSTACK_API_KEY') ?? '';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-4);
  const length = key.length;

  return new Response(
    JSON.stringify({ prefix, suffix, length, hasKey: !!key }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
