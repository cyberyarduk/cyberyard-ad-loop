/**
 * PlayerOverlay
 *
 * A live, CSS-only animated effect rendered on top of a static image
 * by the player. Lets users add motion (golden stars, sparkles, shimmer)
 * to plain image uploads without any video render — zero per-upload cost.
 *
 * Pass `kind="none"` (or omit) to render nothing at all (clean menu mode).
 */
import { useMemo } from "react";

export type PlayerOverlayKind = "none" | "stars" | "sparkles" | "shimmer";

interface Props {
  kind?: PlayerOverlayKind | string | null;
  /** Number of particles for stars/sparkles. Defaults to 18. */
  count?: number;
}

const PlayerOverlay = ({ kind, count = 18 }: Props) => {
  // Stable per-render particle layout so positions don't jump every frame.
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      size: 14 + Math.random() * 22,
    }));
  }, [count, kind]);

  if (!kind || kind === "none") return null;

  if (kind === "shimmer") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <div className="player-overlay-shimmer-sweep" />
        <style>{`
          .player-overlay-shimmer-sweep {
            position: absolute;
            top: 0; bottom: 0;
            width: 35%;
            left: -50%;
            background: linear-gradient(
              115deg,
              transparent 0%,
              rgba(255,255,255,0.25) 45%,
              rgba(255,255,255,0.55) 50%,
              rgba(255,255,255,0.25) 55%,
              transparent 100%
            );
            transform: skewX(-15deg);
            animation: player-overlay-sweep 3.6s ease-in-out infinite;
          }
          @keyframes player-overlay-sweep {
            0%   { left: -50%; opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { left: 130%; opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // stars + sparkles share a particle field, just different glyph + colour.
  const isStars = kind === "stars";
  const glyph = isStars ? "★" : "✦";
  const color = isStars ? "#FFD24A" : "#FFFFFF";
  const glow = isStars ? "rgba(255,210,74,0.85)" : "rgba(255,255,255,0.85)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="player-overlay-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            color,
            textShadow: `0 0 ${Math.round(p.size * 0.6)}px ${glow}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {glyph}
        </span>
      ))}
      <style>{`
        .player-overlay-particle {
          position: absolute;
          line-height: 1;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.4);
          animation-name: player-overlay-twinkle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          will-change: transform, opacity;
        }
        @keyframes player-overlay-twinkle {
          0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.4) rotate(0deg); }
          40%  { opacity: 0.95; transform: translate(-50%, -55%) scale(1)  rotate(15deg); }
          60%  { opacity: 0.95; transform: translate(-50%, -45%) scale(1)  rotate(-10deg); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.4) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default PlayerOverlay;
