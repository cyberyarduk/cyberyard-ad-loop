import { useState, useRef } from "react";

interface PlayerSplashProps {
  onComplete: () => void;
}

const PlayerSplash = ({ onComplete }: PlayerSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleVideoError = () => {
    console.error('Splash video failed to load');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleCanPlay = () => {
    setVideoReady(true);
    videoRef.current?.play().catch(() => {
      setTimeout(() => onComplete(), 1000);
    });
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <video
        ref={videoRef}
        src="/splash-video.mp4"
        className={`w-full h-full object-cover transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        muted
        playsInline
        controls={false}
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={handleVideoEnd}
        onError={handleVideoError}
      />
    </div>
  );
};

export default PlayerSplash;
