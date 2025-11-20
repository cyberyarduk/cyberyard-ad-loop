import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PlaylistVideo {
  id: string;
  video_url: string;
  order_index: number;
}

const Player = () => {
  const { deviceId } = useParams();
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!deviceId) return;

      // Get the device and its playlist
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('playlist_id')
        .eq('id', deviceId)
        .single();

      if (deviceError || !device?.playlist_id) {
        console.error("Device not found or no playlist assigned:", deviceError);
        setVideos([]);
        return;
      }

      // Get videos in the playlist
      const { data: playlistVideos, error: videosError } = await supabase
        .from('playlist_videos')
        .select(`
          order_index,
          videos (
            id,
            video_url
          )
        `)
        .eq('playlist_id', device.playlist_id)
        .order('order_index', { ascending: true });

      if (videosError) {
        console.error("Error fetching videos:", videosError);
        setVideos([]);
        return;
      }

      const formattedVideos: PlaylistVideo[] = playlistVideos
        .filter(pv => pv.videos)
        .map(pv => ({
          id: (pv.videos as any).id,
          video_url: (pv.videos as any).video_url,
          order_index: pv.order_index,
        }));

      setVideos(formattedVideos);
    };

    fetchVideos();

    // Update device last_seen_at
    const updateLastSeen = async () => {
      if (!deviceId) return;
      await supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', deviceId);
    };
    
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [deviceId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // Move to next video or loop back to start
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [videos.length]);

  useEffect(() => {
    // Play the current video
    const video = videoRef.current;
    if (video && videos[currentIndex]) {
      video.load();
      video.play().catch(err => console.error("Autoplay failed:", err));
    }
  }, [currentIndex, videos]);

  if (videos.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-2">No Content Assigned</h1>
          <p className="text-muted-foreground">
            Please assign a playlist to device: {deviceId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        autoPlay
        muted
        src={videos[currentIndex]?.video_url}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default Player;