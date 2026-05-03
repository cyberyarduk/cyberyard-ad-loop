import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PlayerAdminMode from "./PlayerAdminMode";
import PlayerOverlay from "@/components/PlayerOverlay";
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Loader2, WifiOff, Maximize, Minimize } from "lucide-react";

interface Video {
  id: string;
  title: string;
  video_url: string;
  order_index: number;
  media_type?: 'video' | 'image' | 'youtube' | 'webpage';
  image_url?: string | null;
  image_url_landscape?: string | null;
  video_url_landscape?: string | null;
  source_url?: string | null;
  display_duration?: number | null;
  player_overlay?: string | null;
}

const getPlayableUrl = (item?: Video | null) => {
  if (!item) return "";
  if (item.media_type === 'youtube' || item.media_type === 'webpage') {
    return item.source_url || item.video_url || "";
  }
  if (item.media_type === 'video') {
    return item.video_url || item.video_url_landscape || item.image_url || item.image_url_landscape || "";
  }
  return item.image_url || item.video_url || item.image_url_landscape || item.video_url_landscape || "";
};
const isImageMedia = (item?: Video | null) => {
  if (item?.media_type === 'video' || item?.media_type === 'youtube' || item?.media_type === 'webpage') return false;
  if (item?.media_type === 'image') return true;
  const url = getPlayableUrl(item);
  return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url);
};
const isIframeMedia = (item?: Video | null) =>
  item?.media_type === 'youtube' || item?.media_type === 'webpage';

// Convert any YouTube URL to an embed URL with autoplay+mute and JS API enabled
// so we can detect when the video naturally ends.
const toYouTubeEmbed = (url: string): string => {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1);
    } else if (u.searchParams.get('v')) {
      id = u.searchParams.get('v') || '';
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.split('/embed/')[1];
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.split('/shorts/')[1];
    }
    if (!id) return url;
    const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${origin}`;
  } catch {
    return url;
  }
};
const appendCacheBust = (url: string, version: number) => {
  if (!url || !version) return url;
  return `${url}${url.includes('?') ? '&' : '?'}pv=${version}`;
};

interface PlayerVideoProps {
  authToken: string;
  deviceInfo: {
    id?: string;
    device_id?: string;
    device_name?: string;
    company_id?: string;
    playlist_id?: string | null;
  };
}

const PlayerVideo = ({ authToken, deviceInfo }: PlayerVideoProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlistRevision, setPlaylistRevision] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [cachedVideos, setCachedVideos] = useState<Video[]>([]);
  const [imageRenderUrl, setImageRenderUrl] = useState<string>("");
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const lastErrorToastRef = useRef(0);
  const videosRef = useRef<Video[]>([]);
  const activePlaylistIdRef = useRef<string | null>(null);
  const deviceId = deviceInfo?.id || deviceInfo?.device_id;
  
  // Keep videosRef in sync with videos state
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

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

      // Get screen dimensions
      const screenWidth = window.screen.width * (window.devicePixelRatio || 1);
      const screenHeight = window.screen.height * (window.devicePixelRatio || 1);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
        {
          method: 'GET',
          headers: {
            'x-device-token': authToken,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(batteryLevel !== null && { 'x-battery-level': batteryLevel.toString() }),
            'x-screen-width': Math.round(screenWidth).toString(),
            'x-screen-height': Math.round(screenHeight).toString()
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

      // Check if device is suspended
      if (data.suspended) {
        console.log('Device is suspended');
        setIsSuspended(true);
        setVideos([]);
        setLoading(false);
        return;
      }

      // Device is active - clear suspended state if it was set
      setIsSuspended(false);
      activePlaylistIdRef.current = data.playlist_id ?? null;
      
      console.log('Fetched videos:', data.videos, 'playlist_id:', data.playlist_id);
      const newVideos = (data.videos || []).filter((item: Video) => !!getPlayableUrl(item));
      
      // If videos changed, reset to first video and force playback
      if (JSON.stringify(newVideos) !== JSON.stringify(videosRef.current)) {
        console.log('Playlist changed! Switching to new playlist');
        setVideos(newVideos);
        setPlaylistRevision((version) => version + 1);
        setCurrentIndex(0);
        
        // Force immediate playback of first video in new playlist
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(e => console.error('Failed to autoplay new playlist:', e));
          }
        }, 50);
        
        if (videosRef.current.length > 0) {
          toast.success('Playlist updated!');
        }
      } else {
        setVideos(newVideos);
      }
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
  }, [authToken]);

  // Network listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let networkListener: Awaited<ReturnType<typeof Network.addListener>> | null = null;
    
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

  // NOTE: Pull-to-refresh disabled — the player auto-polls every 5s, and on
  // touchscreens (phones/tablets) the gesture was firing constantly while
  // viewing image items, spamming the "Content refreshed" toast and making
  // the screen appear unresponsive. Kept as no-ops in case future code paths
  // still reference them.
  const handleTouchStart = (_e: React.TouchEvent) => {};
  const handleTouchMove = (_e: React.TouchEvent) => {};
  const handleTouchEnd = async () => {};


  useEffect(() => {
    fetchPlaylist();

    // Refresh playlist every 2 seconds for near-instant content updates on devices
    refreshIntervalRef.current = setInterval(() => {
      fetchPlaylist();
    }, 2 * 1000);

    // Set up realtime listener for device changes
    const channel = supabase
      .channel('device-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`
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
              activePlaylistIdRef.current = data.playlist_id ?? null;
              const newVideos = data.videos.filter((item: Video) => !!getPlayableUrl(item));
            
            if (newVideos.length > 0 && JSON.stringify(newVideos) !== JSON.stringify(videosRef.current)) {
              console.log('New playlist detected - switching immediately');
              setVideos(newVideos);
              setPlaylistRevision((version) => version + 1);
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_videos'
        },
        async (payload) => {
          const row = (payload.new || payload.old) as { playlist_id?: string } | null;
          if (!row?.playlist_id || row.playlist_id !== activePlaylistIdRef.current) return;
          console.log('Active playlist contents changed, refreshing:', payload);
          await fetchPlaylist();
        }
      )
      .subscribe();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      const player = videoRef.current;
      if (player) {
        player.pause();
        player.src = '';
      }
      supabase.removeChannel(channel);
    };
  }, [authToken, deviceId, fetchPlaylist]);

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

  // If index is out of bounds, reset to 0 (must be before conditional returns)
  useEffect(() => {
    if (currentIndex >= videos.length && videos.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, videos.length]);

  // Image / iframe item auto-advance timer (must be before conditional returns).
  // For image, youtube and webpage items, advance after `display_duration` seconds.
  // Default duration: 10s (image), 30s (youtube/webpage).
  const _safeIdxForImage = currentIndex < videos.length ? currentIndex : 0;
  const _currentForImage = videos[_safeIdxForImage];
  const _isImageItemEffect = isImageMedia(_currentForImage);
  const _isIframeItemEffect = isIframeMedia(_currentForImage);
  const _isYouTubeItem = _currentForImage?.media_type === 'youtube';
  useEffect(() => {
    if (!_currentForImage) return;
    if (!_isImageItemEffect && !_isIframeItemEffect) return;
    if (videos.length <= 1) return;
    // YouTube: long fallback (1h) — natural end is detected via postMessage below.
    // Webpage: 60s default. Image: 10s default.
    const defaultSecs = _isYouTubeItem ? 3600 : (_isIframeItemEffect ? 60 : 10);
    const seconds = Math.max(1, Math.min(7200, _currentForImage.display_duration ?? defaultSecs));
    const t = setTimeout(() => {
      handleVideoEnd();
    }, seconds * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_currentForImage?.id, _safeIdxForImage, _isImageItemEffect, _isIframeItemEffect, _isYouTubeItem, videos.length]);

  // Listen for YouTube IFrame API end-of-video events and advance the playlist.
  useEffect(() => {
    if (!_isYouTubeItem || videos.length <= 1) return;
    const onMsg = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      if (!/youtube\.com$/.test(new URL(event.origin).hostname || '')) return;
      try {
        const msg = JSON.parse(event.data);
        // YT.PlayerState.ENDED === 0
        if (msg?.event === 'onStateChange' && msg.info === 0) {
          handleVideoEnd();
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('message', onMsg);
    // Ask the iframe to start sending us state-change events.
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com/embed"]');
    iframes.forEach((f) => {
      try {
        f.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening', id: f.id || 'yt' }),
          '*'
        );
        f.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
          '*'
        );
      } catch { /* ignore */ }
    });
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_currentForImage?.id, _isYouTubeItem, videos.length]);

  // Track fullscreen state changes (Esc key, etc.) — must stay before any
  // conditional returns so React hook order is stable when media loads.
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Android WebView can be flaky with cross-origin storage images. Fetch the
  // active image as a blob and render a local object URL, with direct URL fallback.
  useEffect(() => {
    if (!_currentForImage || !_isImageItemEffect) {
      setImageRenderUrl("");
      return;
    }

    let cancelled = false;
    let objectUrl = "";
    const directUrl = appendCacheBust(getPlayableUrl(_currentForImage), playlistRevision);
    setImageRenderUrl(directUrl);

    fetch(directUrl, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageRenderUrl(objectUrl);
      })
      .catch((error) => {
        console.error('[Image] Blob fallback failed, using direct URL:', error);
        if (!cancelled) setImageRenderUrl(directUrl);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [_currentForImage?.id, _isImageItemEffect, playlistRevision]);

  // Native Android WebView has repeatedly failed to paint normal <img>/CSS
  // image layers on some devices. For native image items, render the image and
  // sparkles into a single canvas so the player does not depend on DOM image
  // compositing or CSS animation support.
  useEffect(() => {
    if (!isNative || !_currentForImage || !_isImageItemEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frameId = 0;
    let disposed = false;
    let imageLoaded = false;
    const img = new Image();
    img.decoding = 'async';

    const directUrl = appendCacheBust(getPlayableUrl(_currentForImage), playlistRevision);
    const sourceUrl = imageRenderUrl || directUrl;
    if (!sourceUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width: rect.width, height: rect.height };
    };

    const draw = (time: number) => {
      if (disposed) return;

      const { width, height } = resizeCanvas();
      ctx.fillStyle = 'hsl(0 0% 0%)';
      ctx.fillRect(0, 0, width, height);

      if (imageLoaded) {
        drawContainedImage(ctx, img, width, height);
      }

      drawCanvasSparkles(ctx, width, height, time);
      frameId = requestAnimationFrame(draw);
    };

    img.onload = () => {
      imageLoaded = true;
      console.log('[NativeCanvasImage] Loaded successfully:', sourceUrl);
    };
    img.onerror = () => {
      console.error('[NativeCanvasImage] Load error:', sourceUrl);
      if (videosRef.current.length > 1) handleVideoEnd();
    };
    img.src = sourceUrl;

    window.addEventListener('resize', resizeCanvas);
    frameId = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative, _currentForImage?.id, _isImageItemEffect, imageRenderUrl, playlistRevision]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
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
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  // Show suspended screen
  if (isSuspended) {
    return (
      <div 
        className="min-h-screen bg-black flex flex-col items-center justify-center"
        onTouchStart={handleTripleTap}
        onClick={handleTripleTap}
      >
        <div className="text-white text-center p-8">
          <div className="text-3xl mb-4 font-semibold">Device Suspended</div>
          <div className="text-muted-foreground text-lg">
            This device has been temporarily suspended by an administrator.
          </div>
          <div className="text-muted-foreground text-sm mt-4">
            The device will automatically resume when reactivated.
          </div>
        </div>
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

  // Safety check: compute safe index without setting state during render
  const safeIndex = currentIndex < videos.length ? currentIndex : 0;
  const currentVideo = videos[safeIndex];
  const isImageItem = isImageMedia(currentVideo);
  const isIframeItem = isIframeMedia(currentVideo);
  const currentMediaUrl = appendCacheBust(getPlayableUrl(currentVideo), playlistRevision);
  const currentImageUrl = isImageItem ? (imageRenderUrl || currentMediaUrl) : currentMediaUrl;
  const iframeSrc = isIframeItem
    ? (currentVideo?.media_type === 'youtube'
        ? toYouTubeEmbed(currentVideo.source_url || currentVideo.video_url)
        : (currentVideo?.source_url || currentVideo?.video_url || ''))
    : '';


  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={(e) => {
        handleTripleTap(e);
        handleTouchStart(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTripleTap}
    >
      <style>{`
        @keyframes playerMediaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .player-media-fade {
          animation: playerMediaFadeIn 450ms ease-in-out both;
        }
      `}</style>

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

      {/* Fullscreen toggle — desktop browser only */}
      {!isNative && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="absolute bottom-4 right-4 z-50 bg-white/15 hover:bg-white/25 text-white rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      )}
      
      {/* Tap counter - only show when actively tapping */}
      {tapCount > 0 && (
        <div className="absolute top-20 right-4 z-50 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{tapCount}</span>
        </div>
      )}
      
      {currentVideo && isImageItem && isNative && (
        <>
          <canvas
            ref={canvasRef}
            key={`${currentVideo.id}-${safeIndex}-native-canvas`}
            className="player-media-fade absolute inset-0 z-10 h-full w-full"
            aria-label={currentVideo.title}
          />
          <PlayerOverlay kind={currentVideo.player_overlay} />
        </>
      )}

      {currentVideo && isImageItem && !isNative && (
        <div
          key={`${currentVideo.id}-${safeIndex}`}
          className="player-media-fade absolute inset-0 z-10 bg-black"
        >
          <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat"
            style={{ backgroundImage: `url("${currentImageUrl.replace(/"/g, '%22')}")` }}
            aria-hidden="true"
          />
          <img
            src={currentImageUrl}
            alt={currentVideo.title}
            className="absolute inset-0 h-full w-full object-contain"
            decoding="async"
            loading="eager"
            onLoad={() => {
              console.log('[Image] Loaded successfully:', currentMediaUrl);
            }}
            onError={() => {
              console.error('[Image] Load error for URL:', currentMediaUrl);
              if (videos.length > 1) handleVideoEnd();
            }}
          />
          <PlayerOverlay kind={currentVideo.player_overlay} />
        </div>
      )}

      {currentVideo && isIframeItem && (
        <iframe
          key={`${currentVideo.id}-${safeIndex}-iframe`}
          src={iframeSrc}
          title={currentVideo.title}
          className="player-media-fade absolute inset-0 z-10 h-full w-full border-0 bg-black"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          onError={() => {
            console.error('[Iframe] Failed to load:', iframeSrc);
            if (videos.length > 1) handleVideoEnd();
          }}
        />
      )}

      {currentVideo && !isImageItem && !isIframeItem && (
        <video
          ref={videoRef}
          key={`${currentVideo.id}-${safeIndex}`}
          src={currentMediaUrl}
          className="player-media-fade relative z-10 w-full h-full object-contain"
          autoPlay
          muted
          playsInline
          controls={false}
          preload="auto"
          webkit-playsinline="true"
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error('Manual play failed:', e));
            }
          }}
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Failed video URL:', currentMediaUrl);
            console.error('Video error details:', videoRef.current?.error);

            const now = Date.now();
            if (now - lastErrorToastRef.current > 10000) {
              toast.error(`Tap screen to play video`);
              lastErrorToastRef.current = now;
            }

            errorCountRef.current += 1;
            if (errorCountRef.current >= 3) {
              console.error('Too many consecutive errors, pausing playback');
              errorCountRef.current = 0;
              return;
            }

            if (videos.length > 1) {
              handleVideoEnd();
            }
          }}
          onLoadStart={() => {
            console.log('Video loading started:', currentMediaUrl);
          }}
          onLoadedData={() => {
            console.log('Video loaded:', currentMediaUrl);
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => {
                console.error('Autoplay failed:', e);
              });
            }
          }}
          onPlay={() => {
            console.log('Video started playing:', currentMediaUrl);
            errorCountRef.current = 0;
          }}
        />
      )}

      {/* Per-item overlay is handled inside each media branch via <PlayerOverlay />.
          The previous always-on SparkleOverlay was removed so users can opt in
          per playlist item (none / stars / sparkles / shimmer). */}

      {/* Invisible tap zone indicator (only visible during development) */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-0 hover:opacity-10 bg-red-500 pointer-events-none"
        style={{ transition: 'opacity 0.3s' }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Canvas helpers for native Android fallback rendering.
// ---------------------------------------------------------------------------
const drawContainedImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) => {
  const imageWidth = img.naturalWidth || img.width;
  const imageHeight = img.naturalHeight || img.height;
  if (!imageWidth || !imageHeight || !canvasWidth || !canvasHeight) return;

  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, width, height);
};

const drawCanvasSparkles = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number
) => {
  const sparkles = [
    { x: 0.12, y: 0.08, delay: 0, size: 14 },
    { x: 0.78, y: 0.18, delay: 1.2, size: 18 },
    { x: 0.06, y: 0.42, delay: 2.4, size: 12 },
    { x: 0.88, y: 0.60, delay: 0.6, size: 16 },
    { x: 0.22, y: 0.76, delay: 1.8, size: 14 },
    { x: 0.68, y: 0.88, delay: 3.0, size: 20 },
    { x: 0.50, y: 0.30, delay: 2.1, size: 10 },
    { x: 0.40, y: 0.54, delay: 3.6, size: 12 },
  ];

  sparkles.forEach((sparkle) => {
    const phase = (time / 1000 + sparkle.delay) % 2.8;
    const pulse = (Math.sin((phase / 2.8) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    const alpha = 0.18 + pulse * 0.82;
    const radius = sparkle.size * (0.55 + pulse * 0.63);
    const x = sparkle.x * canvasWidth;
    const y = sparkle.y * canvasHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((phase / 2.8) * Math.PI);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'hsl(50 100% 84%)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'hsl(50 100% 84%)';
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.18, -radius * 0.18);
    ctx.lineTo(radius, 0);
    ctx.lineTo(radius * 0.18, radius * 0.18);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 0.18, radius * 0.18);
    ctx.lineTo(-radius, 0);
    ctx.lineTo(-radius * 0.18, -radius * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
};

// ---------------------------------------------------------------------------
// SparkleOverlay — small attention-grabbing sparkles rendered above the
// playing media. Pure CSS animation so it costs nothing. pointer-events-none
// so the 4-tap admin gesture still works underneath.
// ---------------------------------------------------------------------------
const SparkleOverlay = () => {
  // Fixed deterministic positions so render is stable across frames.
  const sparkles = [
    { top: '8%',  left: '12%', delay: '0s',   size: 14 },
    { top: '18%', left: '78%', delay: '1.2s', size: 18 },
    { top: '42%', left: '6%',  delay: '2.4s', size: 12 },
    { top: '60%', left: '88%', delay: '0.6s', size: 16 },
    { top: '76%', left: '22%', delay: '1.8s', size: 14 },
    { top: '88%', left: '68%', delay: '3.0s', size: 20 },
    { top: '30%', left: '50%', delay: '2.1s', size: 10 },
    { top: '54%', left: '40%', delay: '3.6s', size: 12 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style>{`
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.55) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1.18) rotate(180deg); }
        }
        .cy-sparkle {
          position: absolute;
          color: hsl(50 100% 84%);
          filter: drop-shadow(0 0 10px hsl(50 100% 84% / 0.95)) drop-shadow(0 0 22px hsl(42 100% 56% / 0.7));
          animation: sparkleTwinkle 2.8s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
      {sparkles.map((s, i) => (
        <svg
          key={i}
          className="cy-sparkle"
          style={{
            top: s.top,
            left: s.left,
            width: s.size * 4,
            height: s.size * 4,
            animationDelay: s.delay,
            transform: 'translate(-50%, -50%)',
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0 L13.5 9 L22 12 L13.5 15 L12 24 L10.5 15 L2 12 L10.5 9 Z" />
        </svg>
      ))}
    </div>
  );
};

export default PlayerVideo;
