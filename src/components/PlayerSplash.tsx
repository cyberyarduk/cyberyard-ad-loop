import { useState, useEffect, useRef } from "react";
import logoLight from "@/assets/logo-light.png";

interface PlayerSplashProps {
  onComplete: () => void;
  duration?: number;
}

const PlayerSplash = ({ onComplete, duration = 3000 }: PlayerSplashProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out before duration ends
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    // Complete after duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Logo with pulse animation */}
      <div className="animate-pulse">
        <img 
          src={logoLight} 
          alt="Cyberyard" 
          className="w-48 h-auto mb-8"
        />
      </div>
      
      {/* Loading indicator */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      <p className="text-white/60 text-sm mt-8">Loading content...</p>
    </div>
  );
};

export default PlayerSplash;
