import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PlayerPairing from "./PlayerPairing";
import PlayerVideo from "./PlayerVideo";

const Player = () => {
  const { deviceId } = useParams();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // Load saved device credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('cyberyard_device_token');
    const savedInfo = localStorage.getItem('cyberyard_device_info');
    
    if (savedToken && savedInfo) {
      setAuthToken(savedToken);
      setDeviceInfo(JSON.parse(savedInfo));
    }
  }, []);

  const handlePaired = (token: string, info: any) => {
    setAuthToken(token);
    setDeviceInfo(info);
    
    // Save to localStorage for persistence
    localStorage.setItem('cyberyard_device_token', token);
    localStorage.setItem('cyberyard_device_info', JSON.stringify(info));
  };

  // If device is paired, show video player
  if (authToken && deviceInfo) {
    return <PlayerVideo authToken={authToken} deviceInfo={deviceInfo} />;
  }

  // Otherwise, show pairing screen
  return <PlayerPairing onPaired={handlePaired} />;
};

export default Player;
