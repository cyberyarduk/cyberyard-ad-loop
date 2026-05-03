// Converts uploaded PDF / PPTX / DOCX into PNG slides via CloudConvert,
// uploads them to the `images` bucket, and returns public URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  companyId: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CC_KEY = Deno.env.get("CLOUDCONVERT_API_KEY");
    if (!CC_KEY) throw new Error("CLOUDCONVERT_API_KEY not configured");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { fileUrl, fileName, companyId } = parsed.data;

    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "pptx", "ppt", "docx", "doc"].includes(ext)) {
      return new Response(
        JSON.stringify({ error: "Unsupported file type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create CloudConvert job: import URL → convert to PNG → export URL
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CC_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-1": { operation: "import/url", url: fileUrl, filename: fileName },
          "convert-1": {
            operation: "convert",
            input: "import-1",
            output_format: "png",
            engine: ext === "pdf" ? "poppler" : "office",
            pixel_density: 150,
          },
          "export-1": { operation: "export/url", input: "convert-1" },
        },
      }),
    });

    if (!jobRes.ok) {
      const t = await jobRes.text();
      throw new Error(`CloudConvert job failed [${jobRes.status}]: ${t}`);
    }
    const job = await jobRes.json();
    const jobId = job.data.id;

    // Poll job until finished (up to ~90s)
    let exportTask: any = null;
    for (let i = 0; i < 45; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const sRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${CC_KEY}` },
      });
      const s = await sRes.json();
      if (s.data.status === "error") throw new Error("CloudConvert conversion failed");
      if (s.data.status === "finished") {
        exportTask = s.data.tasks.find((t: any) => t.operation === "export/url");
        break;
      }
    }
    if (!exportTask) throw new Error("CloudConvert timed out");

    const files: { filename: string; url: string }[] = exportTask.result?.files || [];

    // Re-upload each PNG to our images bucket
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const uploaded: { url: string; pageIndex: number }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const imgRes = await fetch(f.url);
      const blob = await imgRes.arrayBuffer();
      const path = `${companyId}/docs/${Date.now()}-${i}-${f.filename}`;
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
      uploaded.push({ url: pub.publicUrl, pageIndex: i });
    }

    return new Response(
      JSON.stringify({ pages: uploaded, totalPages: uploaded.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("convert-document error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
