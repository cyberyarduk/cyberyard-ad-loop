import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PlayerPairing from "./PlayerPairing";
import PlayerVideo from "./PlayerVideo";
import PlayerSplash from "@/components/PlayerSplash";
import { useNativeApp } from "@/hooks/useNativeApp";
import { toast } from "sonner";

const Player = () => {
  const { deviceId } = useParams();
  const [searchParams] = useSearchParams();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [autoPairing, setAutoPairing] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    const splashShown = sessionStorage.getItem('splash_shown');
    return !splashShown;
  });

  // Initialize native app features (fullscreen, orientation lock, etc.)
  useNativeApp();

  // Load saved device credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('cyberyard_device_token');
    const savedInfo = localStorage.getItem('cyberyard_device_info');

    if (savedToken && savedInfo) {
      setAuthToken(savedToken);
      setDeviceInfo(JSON.parse(savedInfo));
    }
  }, []);

  // Auto-pair via ?code=XXXXXX query param ("Use this device" from portal)
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || authToken) return;

    const pair = async () => {
      setAutoPairing(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-pair`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ device_code: code.toUpperCase() }),
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Pairing failed');
        }
        toast.success('This device is now paired');
        handlePaired(data.auth_token, {
          device_id: data.device_id,
          device_name: data.device_name,
          company_id: data.company_id,
          playlist_id: data.playlist_id,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Auto-pairing failed');
      } finally {
        setAutoPairing(false);
      }
    };
    pair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePaired = (token: string, info: any) => {
    setAuthToken(token);
    setDeviceInfo(info);
    
    // Save to localStorage for persistence
    localStorage.setItem('cyberyard_device_token', token);
    localStorage.setItem('cyberyard_device_info', JSON.stringify(info));
  };

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  // Show splash screen on initial load
  if (showSplash) {
    return <PlayerSplash onComplete={handleSplashComplete} />;
  }

  // If device is paired, show video player
  if (authToken && deviceInfo) {
    return <PlayerVideo authToken={authToken} deviceInfo={deviceInfo} />;
  }

  // Otherwise, show pairing screen
  return <PlayerPairing onPaired={handlePaired} />;
};

export default Player;
