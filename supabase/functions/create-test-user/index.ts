import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create the test user
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: "user@cyberyard.com",
      password: "password",
      email_confirm: true,
      user_metadata: {
        full_name: "Test User",
        role: "company_user"
      }
    });

    if (createError) {
      // If user already exists, that's fine
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ success: true, message: "User already exists" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test user created",
        email: "user@cyberyard.com",
        password: "password"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
