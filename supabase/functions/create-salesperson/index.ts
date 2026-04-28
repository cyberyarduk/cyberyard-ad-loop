import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  full_name: z.string().min(1).max(120),
  employee_number: z.string().min(1).max(40),
  area: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  monthly_target: z.number().int().min(0).max(10000).default(100),
  start_date: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerErr } = await supabaseAuth.auth.getUser();
    if (callerErr || !caller) throw new Error('Unauthorized');

    const { data: callerProfile } = await supabaseAuth
      .from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'super_admin') {
      throw new Error('Only super admins can create salespeople');
    }

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const body = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create the auth user (auto-confirm so they can log in immediately)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name, role: 'salesperson' },
    });
    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;
    await new Promise(r => setTimeout(r, 400));

    // Update profile role
    await admin.from('profiles').update({
      role: 'salesperson',
      full_name: body.full_name,
      email: body.email,
      company_id: null,
    }).eq('id', userId);

    // Insert salespeople row
    const { error: spError } = await admin.from('salespeople').insert({
      user_id: userId,
      employee_number: body.employee_number,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone ?? null,
      area: body.area ?? null,
      monthly_target: body.monthly_target ?? 100,
      start_date: body.start_date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes ?? null,
    });

    if (spError) {
      // Roll back auth user if salesperson insert fails (e.g. duplicate employee #)
      await admin.auth.admin.deleteUser(userId);
      throw new Error(spError.message);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('create-salesperson error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
