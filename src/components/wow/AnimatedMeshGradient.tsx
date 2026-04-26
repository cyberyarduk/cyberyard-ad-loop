/**
 * Animated mesh-gradient background.
 * Three soft blobs floating slowly behind content.
 */
const AnimatedMeshGradient = ({ className = "" }: { className?: string }) => {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="mesh-blob absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full animate-blob-float"
        style={{ background: "hsl(var(--yellow-bright))" }}
      />
      <div
        className="mesh-blob absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full animate-blob-float-slow"
        style={{ background: "hsl(var(--pink-hot))" }}
      />
      <div
        className="mesh-blob absolute -bottom-40 left-1/4 h-[560px] w-[560px] rounded-full animate-blob-float"
        style={{ background: "hsl(var(--purple-electric))", animationDelay: "-6s" }}
      />
    </div>
  );
};

export default AnimatedMeshGradient;
