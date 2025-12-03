import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PlayerAdminMode from "./PlayerAdminMode";
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Loader2, WifiOff } from "lucide-react";

interface Video {
  id: string;
  title: string;
  video_url: string;
  order_index: number;
}

interface PlayerVideoProps {
  authToken: string;
  deviceInfo: any;
}

const PlayerVideo = ({ authToken, deviceInfo }: PlayerVideoProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedVideos, setCachedVideos] = useState<Video[]>([]);
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const lastErrorToastRef = useRef(0);

  const fetchPlaylist = useCallback(async () => {
    try {
      // Check network status
      if (Capacitor.isNativePlatform()) {
        const networkStatus = await Network.getStatus();
        if (!networkStatus.connected) {
          setIsOffline(true);
          // Load cached videos if available
          const cached = localStorage.getItem('cached_videos');
          if (cached) {
            const parsedVideos = JSON.parse(cached);
            setVideos(parsedVideos);
            setCachedVideos(parsedVideos);
            toast.info("Playing cached videos (offline mode)");
          }
          setLoading(false);
          return;
        } else {
          setIsOffline(false);
        }
      }

      // Get battery info if on native platform
      let batteryLevel = null;
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getBatteryInfo();
          batteryLevel = info.batteryLevel ? Math.round(info.batteryLevel * 100) : null;
          if (batteryLevel !== null) {
            localStorage.setItem('last_battery_level', batteryLevel.toString());
          }
        } catch (error) {
          console.log('Battery info not available:', error);
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
        {
          method: 'GET',
          headers: {
            'x-device-token': authToken,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(batteryLevel !== null && { 'x-battery-level': batteryLevel.toString() })
          }
        }
      );

      if (response.status === 401) {
        console.log('Device authentication failed - clearing credentials');
        localStorage.removeItem('cyberyard_device_token');
        localStorage.removeItem('cyberyard_device_info');
        localStorage.removeItem('cached_videos');
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch playlist');
      }

      console.log('Fetched videos:', data.videos);
      const newVideos = data.videos || [];
      
      // If videos changed, reset to first video
      if (JSON.stringify(newVideos) !== JSON.stringify(videos)) {
        console.log('Playlist changed, resetting to first video');
        setCurrentIndex(0);
      }
      
      setVideos(newVideos);
      setCachedVideos(newVideos);
      
      // Cache videos for offline mode
      localStorage.setItem('cached_videos', JSON.stringify(newVideos));
      localStorage.setItem('last_playlist_sync', new Date().toISOString());
      
      setLoading(false);
    } catch (error) {
      console.error('Playlist fetch error:', error);
      
      // Try to use cached videos on error
      const cached = localStorage.getItem('cached_videos');
      if (cached) {
        const parsedVideos = JSON.parse(cached);
        setVideos(parsedVideos);
        setCachedVideos(parsedVideos);
        toast.error('Using cached videos (connection issue)');
      } else {
        toast.error('Failed to load videos');
      }
      setLoading(false);
    }
  }, [authToken, videos]);

  // Network listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let networkListener: any;
    
    const setupListener = async () => {
      networkListener = await Network.addListener('networkStatusChange', async (status) => {
        if (status.connected && isOffline) {
          setIsOffline(false);
          toast.success("Back online - refreshing content");
          await fetchPlaylist();
        } else if (!status.connected) {
          setIsOffline(true);
          toast.info("Offline mode - playing cached videos");
        }
      });
    };

    setupListener();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, [isOffline, fetchPlaylist]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !showAdmin) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY;
      if (diff > 100) {
        setIsPullingToRefresh(true);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPullingToRefresh) {
      await fetchPlaylist();
      toast.success("Content refreshed");
    }
    setPullStartY(0);
    setIsPullingToRefresh(false);
  };

  useEffect(() => {
    fetchPlaylist();

    // Refresh playlist every 5 minutes
    refreshIntervalRef.current = setInterval(() => {
      fetchPlaylist();
    }, 5 * 60 * 1000);

    // Set up realtime listener for device changes
    const channel = supabase
      .channel('device-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceInfo.id}`
        },
        async (payload) => {
          console.log('Device updated, fetching new playlist:', payload);
          
          // Check if device was unpaired (status changed to 'unpaired' or auth_token cleared)
          if (payload.new && (payload.new.status === 'unpaired' || !payload.new.auth_token)) {
            console.log('Device was unpaired - clearing credentials and returning to pairing');
            localStorage.removeItem('cyberyard_device_token');
            localStorage.removeItem('cyberyard_device_info');
            window.location.reload();
            return;
          }
          
          // Fetch new playlist
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
            {
              method: 'GET',
              headers: {
                'x-device-token': authToken,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              }
            }
          );

          const data = await response.json();
          
          // If device is invalid, clear credentials
          if (!response.ok || response.status === 401) {
            console.log('Device authentication failed during realtime update - clearing credentials');
            localStorage.removeItem('cyberyard_device_token');
            localStorage.removeItem('cyberyard_device_info');
            window.location.reload();
            return;
          }
          
          if (data.success && data.videos) {
            const newVideos = data.videos;
            
            if (newVideos.length > 0 && JSON.stringify(newVideos) !== JSON.stringify(videos)) {
              console.log('New playlist detected - switching immediately');
              setVideos(newVideos);
              setCurrentIndex(0);
              
              // Force immediate playback of first video in new playlist
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(e => console.error('Failed to autoplay new playlist:', e));
                }
              }, 50);
              
              toast.success('Playlist switched!');
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      supabase.removeChannel(channel);
    };
  }, [authToken, deviceInfo.id, fetchPlaylist, videos]);

  const handleVideoEnd = () => {
    console.log('[VideoEnd] Video ended, current index:', currentIndex, 'total videos:', videos.length);
    
    if (videos.length === 0) return;
    
    // If only one video, restart it manually
    if (videos.length === 1) {
      console.log('[VideoEnd] Single video - restarting');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play()
          .then(() => console.log('[VideoEnd] Single video restarted successfully'))
          .catch(e => {
            console.error('[VideoEnd] Failed to loop single video:', e);
            // Fallback: reload the video
            if (videoRef.current) {
              videoRef.current.load();
              videoRef.current.play().catch(err => console.error('[VideoEnd] Fallback play failed:', err));
            }
          });
      }
      return;
    }
    
    // Move to next video, loop back to start if at end
    const nextIndex = (currentIndex + 1) % videos.length;
    console.log('[VideoEnd] Moving to next video, index:', nextIndex);
    setCurrentIndex(nextIndex);
  };

  const handleTripleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Check if tap is in top-right corner (within 80px from top and right edges - tighter area)
    const isTopRight = x > rect.width - 80 && y < 80;

    if (!isTopRight) {
      // Reset count if tapping outside the corner
      tapCountRef.current = 0;
      setTapCount(0);
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      return;
    }

    tapCountRef.current += 1;
    setTapCount(tapCountRef.current);
    console.log(`Tap ${tapCountRef.current} in corner detected`);

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // Reset after 1.5 seconds of no taps (tighter window)
    tapTimerRef.current = setTimeout(() => {
      console.log('Tap timeout, resetting count');
      tapCountRef.current = 0;
      setTapCount(0);
    }, 1500);

    // Require exactly 4 taps
    if (tapCountRef.current === 4) {
      console.log('Four taps detected - opening admin mode!');
      tapCountRef.current = 0;
      setTapCount(0);
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      setShowAdmin(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  const handleExitAdmin = () => {
    setShowAdmin(false);
    // Refresh playlist in case new videos were added
    fetchPlaylist();
    // Don't try to play here - let the video element handle it
  };

  // Periodic device validity check when no videos (check every 30 seconds)
  // MUST be before conditional returns to follow React hooks rules
  useEffect(() => {
    if (videos.length > 0 || loading) return;
    
    const checkDeviceValidity = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
          {
            method: 'GET',
            headers: {
              'x-device-token': authToken,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          }
        );

        if (response.status === 401) {
          console.log('Device unpaired - clearing credentials and returning to pairing');
          localStorage.removeItem('cyberyard_device_token');
          localStorage.removeItem('cyberyard_device_info');
          localStorage.removeItem('cached_videos');
          window.location.reload();
        }
      } catch (error) {
        console.error('Device validity check failed:', error);
      }
    };

    // Check immediately
    checkDeviceValidity();
    
    // Then check every 30 seconds
    const interval = setInterval(checkDeviceValidity, 30000);
    
    return () => clearInterval(interval);
  }, [videos.length, loading, authToken]);

  if (showAdmin) {
    return (
      <PlayerAdminMode
        authToken={authToken}
        deviceInfo={deviceInfo}
        onExit={handleExitAdmin}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div 
        className="min-h-screen bg-black flex flex-col items-center justify-center"
        onTouchStart={handleTripleTap}
        onClick={handleTripleTap}
      >
        {isOffline && <WifiOff className="h-16 w-16 text-white mb-4" />}
        <div className="text-white text-center p-8">
          <div className="text-2xl mb-4">{isOffline ? 'Offline - No cached videos' : 'No videos in playlist'}</div>
          {!isOffline && (
            <div className="text-muted-foreground">
              Add videos to your playlist from the admin dashboard
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  // Safety check: if currentIndex is out of bounds, reset to 0
  if (!currentVideo && videos.length > 0) {
    setCurrentIndex(0);
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={(e) => {
        handleTripleTap(e);
        handleTouchStart(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTripleTap}
    >
      {/* Pull to refresh indicator */}
      {isPullingToRefresh && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium z-50">
          Release to refresh
        </div>
      )}
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 z-50">
          <WifiOff className="h-4 w-4" />
          Offline
        </div>
      )}
      
      {/* Tap counter - only show when actively tapping */}
      {tapCount > 0 && (
        <div className="absolute top-20 right-4 z-50 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{tapCount}</span>
        </div>
      )}
      
      {currentVideo && (
        <video
          ref={videoRef}
          key={`${currentVideo.id}-${currentIndex}`}
          src={currentVideo.video_url}
          className="w-full h-full object-contain"
          autoPlay
          muted
          playsInline
          preload="auto"
          webkit-playsinline="true"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error('Manual play failed:', e));
            }
          }}
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Failed video URL:', currentVideo.video_url);
            console.error('Video error details:', videoRef.current?.error);
            
            // Limit error toasts - only show once every 10 seconds
            const now = Date.now();
            if (now - lastErrorToastRef.current > 10000) {
              toast.error(`Tap screen to play video`);
              lastErrorToastRef.current = now;
            }
            
            // Track consecutive errors to prevent infinite loops
            errorCountRef.current += 1;
            if (errorCountRef.current >= 3) {
              console.error('Too many consecutive errors, pausing playback');
              errorCountRef.current = 0;
              return;
            }
            
            // Only try next video if we have more than 1
            if (videos.length > 1) {
              handleVideoEnd();
            }
          }}
          onLoadStart={() => {
            console.log('Video loading started:', currentVideo.video_url);
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded:', currentVideo.video_url);
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => {
                console.error('Autoplay failed:', e);
              });
            }
          }}
          onCanPlay={() => {
            console.log('Video can play:', currentVideo.video_url);
            // Try to play when ready
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(e => console.error('CanPlay autoplay failed:', e));
            }
          }}
          onPlay={() => {
            console.log('Video started playing:', currentVideo.video_url);
            errorCountRef.current = 0;
          }}
          onPause={() => {
            console.log('Video paused:', currentVideo.video_url);
            if (!showAdmin && videoRef.current && !videoRef.current.ended) {
              videoRef.current.play().catch(e => console.error('Resume failed:', e));
            }
          }}
          onStalled={() => {
            console.warn('Video playback stalled:', currentVideo.video_url);
          }}
          onSuspend={() => {
            console.warn('Video loading suspended:', currentVideo.video_url);
          }}
        />
      )}
      
      {/* Invisible tap zone indicator (only visible during development) */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 opacity-0 hover:opacity-10 bg-red-500 pointer-events-none"
        style={{ transition: 'opacity 0.3s' }}
      />
    </div>
  );
};

export default PlayerVideo;
