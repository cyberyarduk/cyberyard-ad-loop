// Search Unsplash photos + trigger download tracking (required by Unsplash API guidelines).
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SearchSchema = z.object({
  action: z.literal("search"),
  query: z.string().min(1).max(100),
  page: z.number().int().min(1).max(20).optional().default(1),
});

const DownloadSchema = z.object({
  action: z.literal("track_download"),
  downloadLocation: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!KEY) throw new Error("UNSPLASH_ACCESS_KEY not configured");

    const body = await req.json();

    if (body.action === "track_download") {
      const parsed = DownloadSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Per Unsplash guidelines, hit the download_location to count usage.
      await fetch(parsed.data.downloadLocation, {
        headers: { Authorization: `Client-ID ${KEY}` },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = SearchSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, page } = parsed.data;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=landscape`;

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${KEY}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Unsplash API failed [${res.status}]: ${t}`);
    }
    const data = await res.json();

    const photos = (data.results || []).map((p: any) => ({
      id: p.id,
      thumbUrl: p.urls.small,
      regularUrl: p.urls.regular,
      fullUrl: p.urls.full,
      downloadLocation: p.links.download_location,
      photographer: p.user.name,
      photographerUrl: `${p.user.links.html}?utm_source=cyberyard&utm_medium=referral`,
      unsplashUrl: `${p.links.html}?utm_source=cyberyard&utm_medium=referral`,
      width: p.width,
      height: p.height,
    }));

    return new Response(
      JSON.stringify({ photos, total: data.total, totalPages: data.total_pages }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("unsplash-search error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
