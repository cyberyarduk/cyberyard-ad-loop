import { useEffect, useState } from "react";
import { Clapperboard, Sparkles, Wand2 } from "lucide-react";
import vintageCamera from "@/assets/vintage-camera-operator.png";

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
      {/* Local keyframes for the cranking motion */}
      <style>{`
        @keyframes crank-wind {
          0%, 100% { transform: rotate(-1.5deg) translateY(0); }
          25% { transform: rotate(1deg) translateY(-1px); }
          50% { transform: rotate(-1deg) translateY(1px); }
          75% { transform: rotate(1.5deg) translateY(0); }
        }
        @keyframes reel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="max-w-md w-full px-8 text-center space-y-8">
        {/* Vintage camera + operator */}
        <div className="relative mx-auto w-64 h-64 flex items-center justify-center">
          {/* Soft glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-90" />

          {/* Floating sparkles */}
          <Sparkles
            className="absolute top-2 left-2 h-6 w-6 text-primary/60 animate-pulse"
            style={{ animationDelay: "0s" }}
          />
          <Sparkles
            className="absolute top-8 right-0 h-5 w-5 text-primary/40 animate-pulse"
            style={{ animationDelay: "0.6s" }}
          />
          <Sparkles
            className="absolute bottom-4 right-6 h-4 w-4 text-primary/50 animate-pulse"
            style={{ animationDelay: "1.2s" }}
          />

          {/* Camera image with cranking wobble */}
          <div
            className="relative w-full h-full"
            style={{
              animation: "crank-wind 1.2s ease-in-out infinite",
              transformOrigin: "center bottom",
              filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.15))",
            }}
          >
            <img
              src={vintageCamera}
              alt="Vintage film camera operator winding the crank"
              width={512}
              height={512}
              className="w-full h-full object-contain"
              style={{ animation: "flicker 2.5s ease-in-out infinite" }}
            />
          </div>

          {/* Spinning film reel overlay positioned over the reel in the artwork */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "8%",
              left: "52%",
              width: "26%",
              height: "26%",
              animation: "reel-spin 3s linear infinite",
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-foreground/20 relative">
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground/40" />
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
