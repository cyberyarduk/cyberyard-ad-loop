import { useEffect, useState } from "react";
import { Clapperboard, Wand2 } from "lucide-react";
import loaderVideo from "@/assets/generation-loader.mp4";

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
      <div className="max-w-lg w-full px-8 text-center space-y-8">
        {/* Looping cinematic video — replaces the previous cartoon animation */}
        <div className="relative mx-auto w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black">
          <video
            src={loaderVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Subtle dark overlay to keep the bottom text legible if reused */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-foreground/5 rounded-2xl" />
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
