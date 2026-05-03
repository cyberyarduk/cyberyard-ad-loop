import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PlaylistSelectorDialog } from "@/components/PlaylistSelectorDialog";

type Kind = "youtube" | "webpage";

interface Props {
  kind: Kind;
  trigger: React.ReactNode;
  onComplete?: () => void;
}

// Add https:// if the user didn't include a protocol (so "www.example.com" works)
const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const validateUrl = (url: string, kind: Kind): string | null => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "URL must start with http(s)://";
    if (kind === "youtube") {
      const ok = /(^|\.)youtube\.com$/.test(u.hostname) || /(^|\.)youtu\.be$/.test(u.hostname);
      if (!ok) return "Please paste a YouTube link (youtube.com or youtu.be)";
    }
    return null;
  } catch {
    return "That doesn't look like a valid URL";
  }
};

// Pull the 11-char video id out of any YouTube URL shape.
const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1]?.split("/")[0] || null;
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1]?.split("/")[0] || null;
    return null;
  } catch {
    return null;
  }
};

// Use YouTube's oEmbed endpoint to verify the video both exists AND is allowed
// to be embedded. Owners commonly disable embedding on official music videos,
// which causes Error 153 in the iframe player. oEmbed returns 401/403/404 in
// those cases, letting us reject the URL up-front instead of silently failing.
const checkYouTubeEmbeddable = async (
  url: string
): Promise<{ ok: true; title?: string } | { ok: false; reason: string }> => {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
    );
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: "This video's owner has disabled embedding, so it can't play on screens. Try a different YouTube link." };
    }
    if (res.status === 404) {
      return { ok: false, reason: "We couldn't find that YouTube video — please check the link." };
    }
    if (!res.ok) {
      return { ok: false, reason: "YouTube wouldn't let us preview that video. Try a different link." };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, title: data?.title };
  } catch {
    // Network blocked? Don't hard-fail — let the user proceed.
    return { ok: true };
  }
};

const AddLinkMediaDialog = ({ kind, trigger, onComplete }: Props) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(kind === "youtube" ? "30" : "60");
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeUrl(url);
    if (normalizedUrl !== url) setUrl(normalizedUrl);
    const err = validateUrl(normalizedUrl, kind);
    if (err) {
      toast.error(err);
      return;
    }
    const dur = parseInt(duration, 10);
    if (!dur || dur < 1 || dur > 3600) {
      toast.error("Display time must be 1–3600 seconds");
      return;
    }

    setSubmitting(true);
    try {
      // For YouTube, drop "Mix / Radio" list params (list=RD…) and similar —
      // they reference auto-generated playlists that almost never embed cleanly.
      let cleanUrl = normalizedUrl;
      let resolvedTitle = title;
      if (kind === "youtube") {
        const id = extractYouTubeId(normalizedUrl);
        if (!id) {
          toast.error("We couldn't read a video ID from that YouTube link.");
          setSubmitting(false);
          return;
        }
        cleanUrl = `https://www.youtube.com/watch?v=${id}`;
        const check = await checkYouTubeEmbeddable(cleanUrl);
        if (!check.ok) {
          toast.error((check as { ok: false; reason: string }).reason);
          setSubmitting(false);
          return;
        }
        if (!resolvedTitle && check.ok && check.title) resolvedTitle = check.title;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { data: inserted, error } = await supabase
        .from("videos")
        .insert({
          title: resolvedTitle || (kind === "youtube" ? "YouTube video" : "Web page"),
          user_id: user.id,
          company_id: profile?.company_id,
          media_type: kind,
          source_url: cleanUrl,
          video_url: cleanUrl,
          display_duration: dur,
          source: kind,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      setPendingId(inserted!.id);
      setPickerOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaylistChosen = async (playlistId: string) => {
    if (!pendingId) return;
    try {
      const { data: lastRow } = await supabase
        .from("playlist_videos")
        .select("order_index")
        .eq("playlist_id", playlistId)
        .order("order_index", { ascending: false })
        .limit(1);
      const nextOrder = lastRow && lastRow.length > 0 ? lastRow[0].order_index + 1 : 0;
      const { error } = await supabase
        .from("playlist_videos")
        .insert({ playlist_id: playlistId, video_id: pendingId, order_index: nextOrder });
      if (error) throw error;
      toast.success("Added to playlist");
      setOpen(false);
      setUrl("");
      setTitle("");
      setPendingId(null);
      onComplete?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to add to playlist");
    }
  };

  const isYT = kind === "youtube";

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isYT ? "Add a YouTube video" : "Add a web page"}</DialogTitle>
            <DialogDescription>
              {isYT
                ? "Paste any YouTube link. We'll loop it muted on your screens."
                : "Show any public web page on your screens — menus, dashboards, social walls, Google Reviews, etc."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                placeholder={isYT ? "Brand promo" : "Live menu"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">{isYT ? "YouTube URL" : "Web page URL"}</Label>
              <Input
                id="link-url"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={isYT ? "youtube.com/watch?v=..." : "www.example.com/menu"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {isYT
                  ? "Paste any YouTube link — it will play to the end before moving on."
                  : "No need to type https:// — we'll add it for you."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-dur">
                {isYT ? "Fallback display time (seconds)" : "Display time (seconds)"}
              </Label>
              <Input
                id="link-dur"
                type="number"
                min={1}
                max={3600}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {isYT
                  ? "YouTube videos play to their natural end. This is only used if YouTube can't tell us when it finished."
                  : "How long to show this page before the next playlist item."}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Continue"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <PlaylistSelectorDialog
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) setPendingId(null);
        }}
        onSelected={handlePlaylistChosen}
        title="Add to a playlist"
        description="Pick the playlist this should be added to, or create a new one."
      />
    </>
  );
};

export default AddLinkMediaDialog;
