import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  company_id: string;
  admin_email: string;
  admin_name: string;
  admin_password: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and is a super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // First verify the caller using anon key
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user: caller }, error: callerError } = await supabaseAuth.auth.getUser();
    if (callerError || !caller) {
      throw new Error('Unauthorized');
    }

    // Check if caller is super_admin
    const { data: callerProfile, error: profileError } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || callerProfile?.role !== 'super_admin') {
      throw new Error('Only super admins can create company admins');
    }

    // Now use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { company_id, admin_email, admin_name, admin_password }: CreateAdminRequest = await req.json();

    // Validate inputs
    if (!company_id || !admin_email || !admin_name || !admin_password) {
      throw new Error('Missing required fields');
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    console.log('Creating admin user for company:', company.name);

    // Create the user with email_confirm: false so they get a confirmation email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: false, // User will need to confirm email
      user_metadata: {
        full_name: admin_name,
        role: 'company_admin',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(authError.message);
    }

    console.log('User created:', authData.user.id);

    // Update the profile with company_id (profile is auto-created by trigger)
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: company_id,
        role: 'company_admin',
        full_name: admin_name,
        email: admin_email,
      })
      .eq('id', authData.user.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError);
      // Don't throw - user is created, profile update can be retried
    }

    // Send password reset email so they can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: admin_email,
    });

    if (resetError) {
      console.log('Note: Could not send magic link:', resetError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: 'Company admin created successfully. They will receive an email to confirm their account.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-company-admin:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
