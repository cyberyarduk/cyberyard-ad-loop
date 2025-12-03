import { useState, useRef } from "react";

interface PlayerSplashProps {
  onComplete: () => void;
}

const PlayerSplash = ({ onComplete }: PlayerSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleVideoError = () => {
    // If video fails to load, skip splash after 2 seconds
    console.error('Splash video failed to load');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <video
        ref={videoRef}
        src="/splash-video.mp4"
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoError}
      />
    </div>
  );
};

export default PlayerSplash;
