import { useState, useRef, useEffect } from "react";

interface PlayerSplashProps {
  onComplete: () => void;
}

const PlayerSplash = ({ onComplete }: PlayerSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFadeOut(true);
    setTimeout(() => onComplete(), 400);
  };

  // Hard fallback: never block the app on the splash for more than 4s.
  useEffect(() => {
    const t = setTimeout(() => finish(), 4000);
    const hint = setTimeout(() => setShowSkipHint(true), 1200);
    return () => {
      clearTimeout(t);
      clearTimeout(hint);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCanPlay = () => {
    setVideoReady(true);
    const v = videoRef.current;
    if (!v) return;
    // iOS WKWebView requires muted + playsInline + a real play() call to autoplay.
    v.muted = true;
    v.play().catch(() => {
      // Autoplay blocked — splash will fade out on the fallback timer / tap.
    });
  };

  return (
    <div
      onClick={finish}
      className={`fixed inset-0 bg-black z-50 transition-opacity duration-400 cursor-pointer ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <video
        ref={videoRef}
        src="/splash-video.mp4"
        className={`w-full h-full object-cover transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        muted
        playsInline
        // @ts-ignore — iOS-specific attribute
        webkit-playsinline="true"
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={finish}
        onError={finish}
      />
      {showSkipHint && (
        <div className="absolute inset-x-0 bottom-10 text-center text-white/70 text-xs tracking-wide pointer-events-none">
          Tap to continue
        </div>
      )}
    </div>
  );
};

export default PlayerSplash;
