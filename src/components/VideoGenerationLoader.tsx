import { useEffect, useState } from "react";
import { Camera, Clapperboard, Sparkles, Wand2 } from "lucide-react";

const messages = [
  "Our video director is reviewing your shot list…",
  "Setting up the lights and rolling the camera…",
  "Composing the perfect frame just for you…",
  "Adding a sprinkle of cinematic magic…",
  "Polishing every pixel — almost there…",
];

export function VideoGenerationLoader({ open }: { open: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full px-8 text-center space-y-8">
        {/* Vintage camera */}
        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
          {/* Floating sparkles */}
          <Sparkles
            className="absolute -top-2 -left-2 h-6 w-6 text-primary/60 animate-pulse"
            style={{ animationDelay: "0s" }}
          />
          <Sparkles
            className="absolute top-4 -right-3 h-5 w-5 text-primary/40 animate-pulse"
            style={{ animationDelay: "0.6s" }}
          />
          <Sparkles
            className="absolute -bottom-1 right-2 h-4 w-4 text-primary/50 animate-pulse"
            style={{ animationDelay: "1.2s" }}
          />

          {/* Camera body */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-125" />
            <div
              className="relative bg-foreground text-background rounded-2xl p-6 shadow-2xl"
              style={{ animation: "scale-in 0.5s ease-out" }}
            >
              <Camera className="h-16 w-16" strokeWidth={1.5} />
              {/* Spinning film reel above */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                <div
                  className="w-3 h-3 rounded-full bg-foreground border-2 border-background"
                  style={{ animation: "spin 2s linear infinite" }}
                />
                <div
                  className="w-3 h-3 rounded-full bg-foreground border-2 border-background"
                  style={{ animation: "spin 2s linear infinite reverse" }}
                />
              </div>
              {/* Recording dot */}
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clapperboard className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold">
              Now Filming
            </span>
            <Wand2 className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            We're creating the perfect video for you
          </h2>
          <p
            key={messageIndex}
            className="text-muted-foreground min-h-[3rem] animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress shimmer */}
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full w-1/3 bg-primary rounded-full"
            style={{
              animation: "slide-in-right 1.8s ease-in-out infinite alternate",
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Hang tight — this usually takes 1–2 minutes.
        </p>
      </div>
    </div>
  );
}
