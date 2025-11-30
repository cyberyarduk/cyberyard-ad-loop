import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PlayerAdminMode from "./PlayerAdminMode";
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaylist = async () => {
    try {
      // Get battery info if on native platform
      let batteryLevel = null;
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getBatteryInfo();
          batteryLevel = info.batteryLevel ? Math.round(info.batteryLevel * 100) : null;
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        // If device is invalid (401), clear credentials and return to pairing
        if (response.status === 401) {
          console.log('Device authentication failed - clearing credentials');
          localStorage.removeItem('cyberyard_device_token');
          localStorage.removeItem('cyberyard_device_info');
          window.location.reload();
          return;
        }
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
      setLoading(false);
    } catch (error) {
      console.error('Playlist fetch error:', error);
      toast.error('Failed to load videos');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();

    // Refresh playlist every 30 seconds (reduced from 5 minutes)
    refreshIntervalRef.current = setInterval(() => {
      fetchPlaylist();
    }, 30 * 1000);

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
  }, [authToken, deviceInfo.id]);

  const handleVideoEnd = () => {
    if (videos.length === 0) return;
    
    // Move to next video, loop back to start if at end
    const nextIndex = (currentIndex + 1) % videos.length;
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
        <div className="text-white text-2xl">Loading videos...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center"
        onTouchStart={handleTripleTap}
        onClick={handleTripleTap}
      >
        <div className="text-white text-center p-8">
          <div className="text-2xl mb-4">No videos in playlist</div>
          <div className="text-muted-foreground">
            Add videos to your playlist from the admin dashboard
          </div>
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
      onTouchStart={handleTripleTap}
      onClick={handleTripleTap}
    >
      {/* Tap counter - only show when actively tapping */}
      {tapCount > 0 && (
        <div className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
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
          muted={false}
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Failed video URL:', currentVideo.video_url);
            console.error('Video error details:', videoRef.current?.error);
            toast.error(`Error playing video: ${currentVideo.title}`);
            handleVideoEnd();
          }}
          onLoadStart={() => {
            console.log('Video loading started:', currentVideo.video_url);
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded:', currentVideo.video_url);
            // Ensure autoplay - try immediately
            if (videoRef.current && videoRef.current.paused) {
              console.log('Video is paused, attempting to play...');
              videoRef.current.play().catch(e => {
                console.error('Autoplay failed:', e);
                // Try again with muted if autoplay fails (browser restriction)
                if (videoRef.current) {
                  console.log('Trying muted autoplay...');
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(err => {
                    console.error('Muted autoplay also failed:', err);
                    // As last resort, show play button to user
                    toast.error('Tap the video to play');
                  });
                }
              });
            }
          }}
          onCanPlay={() => {
            console.log('Video can play:', currentVideo.video_url);
          }}
          onPlay={() => {
            console.log('Video started playing:', currentVideo.video_url);
          }}
          onPause={() => {
            console.log('Video paused:', currentVideo.video_url);
            // If video pauses unexpectedly, try to resume
            if (!showAdmin && videoRef.current && !videoRef.current.ended) {
              console.log('Attempting to resume playback...');
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
