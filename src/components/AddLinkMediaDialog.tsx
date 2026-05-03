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
          title: title || (kind === "youtube" ? "YouTube video" : "Web page"),
          user_id: user.id,
          company_id: profile?.company_id,
          media_type: kind,
          source_url: normalizedUrl,
          video_url: normalizedUrl,
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
                type="url"
                placeholder={isYT ? "https://www.youtube.com/watch?v=..." : "https://example.com/menu"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-dur">Display time (seconds)</Label>
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
                  ? "How long to show this video before moving to the next playlist item."
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
