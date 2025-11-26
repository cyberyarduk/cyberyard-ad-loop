import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PlayerAdminMode from "./PlayerAdminMode";

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
  const [pendingPlaylistChange, setPendingPlaylistChange] = useState<Video[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaylist = async () => {
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
          
          if (data.success && data.videos) {
            const newVideos = data.videos;
            
            if (newVideos.length > 0 && JSON.stringify(newVideos) !== JSON.stringify(videos)) {
              console.log('New playlist detected, queuing switch after current video ends');
              // Queue the new playlist - it will switch when current video ends
              setPendingPlaylistChange(newVideos);
              toast.info('New playlist ready - switching after current video');
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
    // Check if there's a pending playlist change
    if (pendingPlaylistChange) {
      console.log('Switching to new playlist after video ended');
      setVideos(pendingPlaylistChange);
      setCurrentIndex(0);
      setPendingPlaylistChange(null);
      toast.success('Playlist updated!');
      return;
    }

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

    // Check if tap is in top-right corner (within 100px from top and right edges)
    const isTopRight = x > rect.width - 100 && y < 100;

    if (!isTopRight) return;

    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);

    if (tapCountRef.current >= 3) {
      console.log('Triple tap detected!');
      tapCountRef.current = 0;
      setShowAdmin(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  const handleExitAdmin = () => {
    setShowAdmin(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
    // Refresh playlist in case new videos were added
    fetchPlaylist();
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
      {currentVideo && (
        <video
          ref={videoRef}
          key={`${currentVideo.id}-${currentIndex}`}
          src={currentVideo.video_url}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Failed video URL:', currentVideo.video_url);
            console.error('Video error details:', videoRef.current?.error);
            toast.error(`Error playing video: ${currentVideo.title}`);
            // Skip to next video on error
            handleVideoEnd();
          }}
          onLoadStart={() => {
            console.log('Video loading started:', currentVideo.video_url);
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded:', currentVideo.video_url);
          }}
          onCanPlay={() => {
            console.log('Video can play:', currentVideo.video_url);
          }}
          onPlay={() => {
            console.log('Video started playing:', currentVideo.video_url);
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
