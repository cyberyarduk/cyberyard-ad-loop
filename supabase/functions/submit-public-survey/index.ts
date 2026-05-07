import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PayloadSchema = z.object({
  role: z.enum(["owner", "manager"]),
  survey_version: z.string().min(1).max(40),
  profile: z.object({
    business_name: z.string().min(1).max(200),
    contact_name: z.string().max(200).optional().nullable(),
    business_type: z.string().max(200).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    city: z.string().max(200).optional().nullable(),
    email: z.string().email().max(200).optional().nullable().or(z.literal("")),
    phone: z.string().max(60).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payload", details: parsed.error.issues }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { role, survey_version, profile, answers } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isTrialLead = answers["q10_trial_interest"] === "yes";

    const { data: lead, error: leadErr } = await supabase
      .from("research_leads")
      .insert({
        business_name: profile.business_name.trim(),
        contact_name: profile.contact_name?.toString().trim() || null,
        business_type: profile.business_type || null,
        address: profile.address?.toString().trim() || null,
        city: profile.city?.toString().trim() || null,
        email: profile.email?.toString().trim() || null,
        phone: profile.phone?.toString().trim() || null,
        notes: profile.notes?.toString().trim() || null,
        status: isTrialLead ? "trial_offered" : "new_lead",
        is_trial_lead: isTrialLead,
        source: `public_${role}`,
      })
      .select()
      .single();
    if (leadErr) throw leadErr;

    if (Object.keys(answers).length > 0) {
      const { error: respErr } = await supabase.from("research_responses").insert({
        lead_id: lead.id,
        survey_version,
        answers,
      });
      if (respErr) throw respErr;
    }

    return new Response(JSON.stringify({ ok: true, lead_id: lead.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("submit-public-survey error", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
