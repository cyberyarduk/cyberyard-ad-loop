import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** "up" (default) or "scale" */
  variant?: "up" | "scale";
}

/**
 * Reveals children with a fade/slide once they enter the viewport.
 * Uses IntersectionObserver — single observer per node, fires once.
 */
const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  variant = "up",
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const animClass = visible
    ? variant === "scale"
      ? "animate-scale-in"
      : "animate-fade-in-up"
    : "opacity-0";

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`}
      style={{ animationDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
