import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet, Square, Maximize2, Crop } from "lucide-react";
import { cn } from "@/lib/utils";

type FormatKey = "actual" | "portrait" | "landscape" | "square" | "tablet";

const FORMATS: {
  key: FormatKey;
  label: string;
  hint: string;
  ratio: number | null;
  icon: typeof Monitor;
}[] = [
  { key: "actual", label: "Actual", hint: "Original file size", ratio: null, icon: Maximize2 },
  { key: "portrait", label: "Phone", hint: "9:16 portrait", ratio: 9 / 16, icon: Smartphone },
  { key: "landscape", label: "TV", hint: "16:9 landscape", ratio: 16 / 9, icon: Monitor },
  { key: "tablet", label: "Tablet", hint: "4:3 landscape", ratio: 4 / 3, icon: Tablet },
  { key: "square", label: "Square", hint: "1:1", ratio: 1, icon: Square },
];

interface MediaPreviewDialogProps {
  media: any | null;
  onOpenChange: (open: boolean) => void;
}

export function MediaPreviewDialog({ media, onOpenChange }: MediaPreviewDialogProps) {
  const [format, setFormat] = useState<FormatKey>("actual");
  const [fill, setFill] = useState(false);

  useEffect(() => {
    if (media) {
      setFormat("actual");
      setFill(false);
    }
  }, [media?.id]);

  const active = FORMATS.find((f) => f.key === format)!;
  const isImage = media?.media_type === "image";

  // Wide shapes should play the landscape master when one exists, so the
  // preview matches exactly what a TV or tablet will show.
  const wantsLandscape = active.ratio !== null && active.ratio > 1;
  const landscapeSrc = isImage ? media?.image_url_landscape : media?.video_url_landscape;
  const portraitSrc = isImage ? media?.image_url || media?.video_url : media?.video_url;
  const src = wantsLandscape && landscapeSrc ? landscapeSrc : portraitSrc;
  const usingLandscapeMaster = wantsLandscape && !!landscapeSrc;

  return (
    <Dialog open={!!media} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-5xl w-[96vw] p-0 overflow-hidden bg-background flex flex-col h-[92vh] max-h-[92vh]">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle className="truncate">{media?.title}</DialogTitle>
          <DialogDescription>
            See how this looks on each shape of screen before it goes live.
          </DialogDescription>
        </DialogHeader>

        {/* Format switcher */}
        <div className="px-6 pb-3 shrink-0 flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            return (
              <Button
                key={f.key}
                type="button"
                size="sm"
                variant={format === f.key ? "default" : "outline"}
                onClick={() => setFormat(f.key)}
                className="gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
              </Button>
            );
          })}
          {active.ratio !== null && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFill((v) => !v)}
              className="gap-1.5 ml-auto"
            >
              <Crop className="h-3.5 w-3.5" />
              {fill ? "Fit (letterbox)" : "Fill (crop)"}
            </Button>
          )}
        </div>

        {media && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 bg-muted/40 px-6 py-4">
            {/* The frame is sized purely by the available space, so nothing is
                ever clipped regardless of viewport height or shape. */}
            <div
              className={cn(
                "relative bg-black rounded-xl overflow-hidden shadow-lg ring-1 ring-border",
                "max-h-full max-w-full"
              )}
              style={
                active.ratio !== null
                  ? {
                      aspectRatio: String(active.ratio),
                      height: "min(100%, 100cqh)",
                      maxHeight: "100%",
                      maxWidth: "100%",
                      width: "auto",
                    }
                  : undefined
              }
            >
              {isImage ? (
                <img
                  src={src}
                  alt={media.title}
                  className={cn(
                    active.ratio === null
                      ? "max-h-full max-w-full object-contain"
                      : cn("absolute inset-0 h-full w-full", fill ? "object-cover" : "object-contain")
                  )}
                />
              ) : (
                <video
                  key={src}
                  src={src}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className={cn(
                    active.ratio === null
                      ? "max-h-full max-w-full object-contain"
                      : cn("absolute inset-0 h-full w-full", fill ? "object-cover" : "object-contain")
                  )}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center shrink-0">
              {active.hint}
              {active.ratio !== null && (fill ? " · cropped to fill the screen" : " · letterboxed to fit")}
              {usingLandscapeMaster && " · showing the widescreen version"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MediaPreviewDialog;
