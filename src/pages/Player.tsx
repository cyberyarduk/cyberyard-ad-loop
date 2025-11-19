import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

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
    // TODO: Fetch playlist videos from Supabase once database is ready
    // For now using mock data
    const mockVideos: PlaylistVideo[] = [
      {
        id: "1",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        order_index: 0,
      },
    ];
    
    setVideos(mockVideos);

    // TODO: Update device last_seen_at
    // const updateLastSeen = async () => {
    //   await supabase
    //     .from('devices')
    //     .update({ last_seen_at: new Date().toISOString() })
    //     .eq('id', deviceId);
    // };
    // updateLastSeen();
    // const interval = setInterval(updateLastSeen, 60000); // Every minute
    // return () => clearInterval(interval);
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