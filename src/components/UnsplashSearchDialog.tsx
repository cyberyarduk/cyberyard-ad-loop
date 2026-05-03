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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateOrientedVariants } from "@/lib/imageOrient";

interface Props {
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

interface Photo {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  fullUrl: string;
  downloadLocation: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

/**
 * Search Unsplash and add a stock photo straight into the media library.
 * Per Unsplash guidelines we hot-link image URLs, attribute the photographer,
 * and trigger the download endpoint when the user actually picks a photo.
 */
export default function UnsplashSearchDialog({ trigger, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("unsplash-search", {
        body: { action: "search", query: query.trim(), page: 1 },
      });
      if (error) throw error;
      setPhotos(data.photos || []);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const pick = async (photo: Photo) => {
    setPicking(photo.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();

      if (!profile?.company_id) {
        throw new Error("No company linked to your account — can't save photo.");
      }

      // Trigger Unsplash download tracking (required for Production approval).
      supabase.functions.invoke("unsplash-search", {
        body: { action: "track_download", downloadLocation: photo.downloadLocation },
      }).catch(() => {});

      // Re-render the Unsplash photo into proper portrait (1080x1920) and
      // landscape (1920x1080) variants so it looks right on phones AND TVs.
      toast.info("Optimising photo for every screen…");
      const { portraitBlob, landscapeBlob } = await generateOrientedVariants(photo.regularUrl);

      const stamp = Date.now();
      const portraitPath = `${user.id}/${stamp}-unsplash-portrait.jpg`;
      const landscapePath = `${user.id}/${stamp}-unsplash-landscape.jpg`;
      const [pUp, lUp] = await Promise.all([
        supabase.storage.from("images").upload(portraitPath, portraitBlob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        }),
        supabase.storage.from("images").upload(landscapePath, landscapeBlob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        }),
      ]);
      if (pUp.error) throw pUp.error;
      if (lUp.error) throw lUp.error;

      const portraitUrl = supabase.storage.from("images").getPublicUrl(portraitPath).data.publicUrl;
      const landscapeUrl = supabase.storage.from("images").getPublicUrl(landscapePath).data.publicUrl;

      const title = `${query} — by ${photo.photographer}`;
      const { error: insErr } = await supabase.from("videos").insert({
        title,
        user_id: user.id,
        company_id: profile.company_id,
        media_type: "image",
        image_url: portraitUrl,
        image_url_landscape: landscapeUrl,
        video_url: portraitUrl,
        display_duration: 10,
        source: "unsplash",
        player_overlay: "none",
      } as any);
      if (insErr) throw insErr;

      toast.success(`Added photo by ${photo.photographer}`);
      setOpen(false);
      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to add photo");
    } finally {
      setPicking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" />
            Stock photos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Search free stock photos</DialogTitle>
          <DialogDescription>
            Powered by Unsplash. Free for commercial use — photographers are credited automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={search} className="flex gap-2">
          <Input
            placeholder="e.g. coffee, gym, hairdresser…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              disabled={picking !== null}
              className="relative group aspect-video bg-muted rounded overflow-hidden hover:ring-2 hover:ring-primary transition disabled:opacity-50"
            >
              <img src={p.thumbUrl} alt={p.photographer} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                {picking === p.id ? "Adding…" : p.photographer}
              </div>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Photos provided by{" "}
          <a href="https://unsplash.com/?utm_source=cyberyard&utm_medium=referral" target="_blank" rel="noreferrer" className="underline">
            Unsplash
          </a>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
