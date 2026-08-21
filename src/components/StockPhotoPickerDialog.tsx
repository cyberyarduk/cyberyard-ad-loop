import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

interface Props {
  trigger: React.ReactNode;
  /** Called with the chosen photo as a ready-to-upload File. */
  onPick: (file: File, previewUrl: string) => void;
}

/**
 * Lightweight Unsplash picker that hands the selected photo back to the caller
 * as a File, so it can be used as the source image for a video.
 */
export default function StockPhotoPickerDialog({ trigger, onPick }: Props) {
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
      if (!data.photos?.length) toast.info("No photos found — try another search.");
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const choose = async (photo: Photo) => {
    setPicking(photo.id);
    try {
      supabase.functions
        .invoke("unsplash-search", {
          body: { action: "track_download", downloadLocation: photo.downloadLocation },
        })
        .catch(() => {});

      const res = await fetch(photo.regularUrl);
      if (!res.ok) throw new Error("Could not download that photo");
      const blob = await res.blob();
      const file = new File([blob], `stock-${photo.id}.jpg`, { type: blob.type || "image/jpeg" });
      onPick(file, URL.createObjectURL(blob));
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Could not use that photo");
    } finally {
      setPicking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use a stock photo</DialogTitle>
          <DialogDescription>
            Search free Unsplash photos and use one as your video image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={search} className="flex gap-2">
          <Input
            placeholder="e.g. coffee, pizza, barber shop"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => choose(photo)}
              disabled={picking !== null}
              className="group relative overflow-hidden rounded-lg border"
            >
              <img
                src={photo.thumbUrl}
                alt={`Stock photo by ${photo.photographer}`}
                className="h-32 w-full object-cover transition group-hover:opacity-80"
                loading="lazy"
              />
              {picking === photo.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              <span className="block truncate px-2 py-1 text-left text-[11px] text-muted-foreground">
                {photo.photographer}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
