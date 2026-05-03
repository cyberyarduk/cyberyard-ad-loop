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
import { Switch } from "@/components/ui/switch";
import { Search, Loader2, Image as ImageIcon, ArrowLeft, Sparkles } from "lucide-react";
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
  const [picking, setPicking] = useState(false);

  // Overlay step
  const [selected, setSelected] = useState<Photo | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [overlaySub, setOverlaySub] = useState("");
  const [overlayPos, setOverlayPos] = useState<"top" | "middle" | "bottom">("bottom");
  const [overlayBg, setOverlayBg] = useState<"none" | "dark" | "light" | "accent">("dark");

  const reset = () => {
    setSelected(null);
    setOverlayText("");
    setOverlaySub("");
    setOverlayPos("bottom");
    setOverlayBg("dark");
  };

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

  const confirmAdd = async () => {
    if (!selected) return;
    const photo = selected;
    setPicking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) {
        throw new Error("No company linked to your account — can't save photo.");
      }

      supabase.functions.invoke("unsplash-search", {
        body: { action: "track_download", downloadLocation: photo.downloadLocation },
      }).catch(() => {});

      toast.info("Optimising photo for every screen…");
      const overlay = (overlayText.trim() || overlaySub.trim())
        ? { text: overlayText, subtext: overlaySub, position: overlayPos, background: overlayBg }
        : undefined;
      const { portraitBlob, landscapeBlob } = await generateOrientedVariants(photo.regularUrl, overlay);

      const stamp = Date.now();
      const portraitPath = `${profile.company_id}/${stamp}-unsplash-portrait.jpg`;
      const landscapePath = `${profile.company_id}/${stamp}-unsplash-landscape.jpg`;
      const [pUp, lUp] = await Promise.all([
        supabase.storage.from("images").upload(portraitPath, portraitBlob, {
          contentType: "image/jpeg", cacheControl: "31536000",
        }),
        supabase.storage.from("images").upload(landscapePath, landscapeBlob, {
          contentType: "image/jpeg", cacheControl: "31536000",
        }),
      ]);
      if (pUp.error) throw pUp.error;
      if (lUp.error) throw lUp.error;

      const portraitUrl = supabase.storage.from("images").getPublicUrl(portraitPath).data.publicUrl;
      const landscapeUrl = supabase.storage.from("images").getPublicUrl(landscapePath).data.publicUrl;

      const title = overlayText.trim() || `${query} — by ${photo.photographer}`;
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
      reset();
      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to add photo");
    } finally {
      setPicking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" />
            Stock photos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        {!selected ? (
          <>
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
                  onClick={() => setSelected(p)}
                  className="relative group aspect-video bg-muted rounded overflow-hidden hover:ring-2 hover:ring-primary transition"
                >
                  <img src={p.thumbUrl} alt={p.photographer} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                    {p.photographer}
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
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add text overlay (optional)</DialogTitle>
              <DialogDescription>
                Type a headline and subtitle to display on top of the image, or leave blank to use the photo as-is.
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Live preview */}
              <div className="relative aspect-[9/16] bg-muted rounded overflow-hidden max-h-[60vh] mx-auto w-full">
                <img src={selected.regularUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                {(overlayText || overlaySub) && (
                  <div
                    className={`absolute inset-x-0 px-4 py-3 text-center ${
                      overlayPos === "top" ? "top-[6%]" : overlayPos === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-[6%]"
                    } ${
                      overlayBg === "dark" ? "bg-black/55 text-white"
                        : overlayBg === "light" ? "bg-white/80 text-black"
                        : overlayBg === "accent" ? "bg-red-600/85 text-white"
                        : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                    }`}
                  >
                    {overlayText && <div className="text-xl font-extrabold leading-tight">{overlayText}</div>}
                    {overlaySub && <div className="text-sm font-medium mt-1">{overlaySub}</div>}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Headline</Label>
                  <Input
                    placeholder="e.g. SUMMER SALE"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Input
                    placeholder="e.g. 20% off everything"
                    value={overlaySub}
                    onChange={(e) => setOverlaySub(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Position</Label>
                    <Select value={overlayPos} onValueChange={(v) => setOverlayPos(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Style</Label>
                    <Select value={overlayBg} onValueChange={(v) => setOverlayBg(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark band</SelectItem>
                        <SelectItem value="light">Light band</SelectItem>
                        <SelectItem value="accent">Accent (red)</SelectItem>
                        <SelectItem value="none">No band (text only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelected(null)} disabled={picking}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={confirmAdd} disabled={picking} className="flex-1">
                    {picking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…</> : "Add to library"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
