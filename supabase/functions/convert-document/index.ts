// Converts uploaded PDF / PPTX / DOCX into PNG slides via CloudConvert,
// then renders ONE looping Shotstack video (portrait + landscape) showing
// every page in sequence. A blurred copy of the page fills the background
// so there are no black bars on TVs/phones regardless of page orientation.
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
  secondsPerPage: z.number().int().min(1).max(120).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CC_KEY = Deno.env.get("CLOUDCONVERT_API_KEY");
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!CC_KEY) throw new Error("CLOUDCONVERT_API_KEY not configured");
    if (!SHOTSTACK_API_KEY) throw new Error("SHOTSTACK_API_KEY not configured");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { fileUrl, fileName, companyId, secondsPerPage = 8 } = parsed.data;

    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "pptx", "ppt", "docx", "doc"].includes(ext)) {
      return new Response(
        JSON.stringify({ error: "Unsupported file type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- 1. CloudConvert: file -> PNG per page ----
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${CC_KEY}`, "Content-Type": "application/json" },
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
      throw new Error(`CloudConvert job failed [${jobRes.status}]: ${await jobRes.text()}`);
    }
    const jobId = (await jobRes.json()).data.id;

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

    const ccFiles: { filename: string; url: string }[] = exportTask.result?.files || [];
    if (!ccFiles.length) throw new Error("No pages produced");

    // ---- 2. Re-upload PNGs to our images bucket so Shotstack can fetch them ----
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const stamp = Date.now();
    const pageUrls: string[] = [];
    for (let i = 0; i < ccFiles.length; i++) {
      const f = ccFiles[i];
      const buf = await (await fetch(f.url)).arrayBuffer();
      const path = `${companyId}/docs/${stamp}-${i}-${f.filename}`;
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, buf, { contentType: "image/png", upsert: false, cacheControl: "31536000" });
      if (upErr) throw upErr;
      pageUrls.push(supabase.storage.from("images").getPublicUrl(path).data.publicUrl);
    }

    // ---- 3. Build ONE Shotstack render that walks through every page ----
    // Layered per page: blurred-cover background + crisp contained page on top.
    // No black bars on either orientation, full content always visible.
    const buildEdit = (isPortrait: boolean) => {
      const W = isPortrait ? 1080 : 1920;
      const H = isPortrait ? 1920 : 1080;
      const tracks: any[] = [];

      // Foreground (page, full visible)
      tracks.push({
        clips: pageUrls.map((src, i) => ({
          asset: { type: "image", src },
          start: i * secondsPerPage,
          length: secondsPerPage,
          fit: "contain",
          transition: i === 0 ? undefined : { in: "fade", out: "fade" },
        })),
      });

      // Background (same page, blurred + cover, fills the canvas)
      tracks.push({
        clips: pageUrls.map((src, i) => ({
          asset: { type: "image", src },
          start: i * secondsPerPage,
          length: secondsPerPage,
          fit: "cover",
          filter: "blur",
          opacity: 0.85,
        })),
      });

      return {
        timeline: { background: "#000000", tracks },
        output: {
          format: "mp4",
          aspectRatio: isPortrait ? "9:16" : "16:9",
          size: { width: W, height: H },
          fps: 30,
        },
      };
    };

    const submitRender = async (edit: any) => {
      const r = await fetch("https://api.shotstack.io/v1/render", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": SHOTSTACK_API_KEY },
        body: JSON.stringify(edit),
      });
      if (!r.ok) throw new Error(`Shotstack submit failed: ${await r.text()}`);
      return (await r.json()).response.id as string;
    };

    const [portraitId, landscapeId] = await Promise.all([
      submitRender(buildEdit(true)),
      submitRender(buildEdit(false)),
    ]);

    const pollRender = async (id: string): Promise<string> => {
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const r = await fetch(`https://api.shotstack.io/v1/render/${id}`, {
          headers: { "x-api-key": SHOTSTACK_API_KEY },
        });
        if (!r.ok) continue;
        const j = await r.json();
        if (j.response.status === "done") return j.response.url;
        if (j.response.status === "failed") throw new Error(`Shotstack render failed: ${j.response.error || ""}`);
      }
      throw new Error("Shotstack render timed out");
    };

    const [portraitUrlRaw, landscapeUrlRaw] = await Promise.all([
      pollRender(portraitId),
      pollRender(landscapeId).catch((e) => { console.error(e); return null; }),
    ]);

    // ---- 4. Persist MP4s into our storage so Shotstack expiry doesn't matter ----
    const persist = async (url: string, label: string) => {
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      const path = `${companyId}/docs/${stamp}-${label}.mp4`;
      const { error } = await supabase.storage.from("videos").upload(path, buf, {
        contentType: "video/mp4", upsert: false, cacheControl: "31536000",
      });
      if (error) throw error;
      return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
    };

    const portraitUrl = await persist(portraitUrlRaw, "portrait");
    const landscapeUrl = landscapeUrlRaw ? await persist(landscapeUrlRaw, "landscape") : null;

    return new Response(
      JSON.stringify({
        videoUrl: portraitUrl,
        videoUrlLandscape: landscapeUrl,
        posterUrl: pageUrls[0],
        totalPages: pageUrls.length,
        totalDurationSeconds: pageUrls.length * secondsPerPage,
      }),
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
