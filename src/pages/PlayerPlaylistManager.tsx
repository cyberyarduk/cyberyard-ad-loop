import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Video {
  id: string;
  title: string;
  video_url: string;
  created_at: string;
  order_index: number;
  playlist_video_id: string;
}

interface PlayerPlaylistManagerProps {
  authToken: string;
  deviceInfo: any;
  onBack: () => void;
}

const PlayerPlaylistManager = ({ authToken, deviceInfo, onBack }: PlayerPlaylistManagerProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistName, setPlaylistName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  useEffect(() => {
    fetchPlaylistVideos();
  }, []);

  const fetchPlaylistVideos = async () => {
    try {
      console.log('Fetching playlist videos for device');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch playlist');
      }

      const data = await response.json();
      console.log('Playlist data:', data);
      
      setPlaylistName(data.playlist_name || "Playlist");
      
      // Map the videos with playlist_video junction table IDs
      const mappedVideos = data.videos.map((v: any) => ({
        id: v.id,
        title: v.title,
        video_url: v.video_url,
        created_at: v.created_at,
        order_index: v.order_index,
        playlist_video_id: v.playlist_video_id // Junction table ID for deletion
      }));
      
      setVideos(mappedVideos);
    } catch (error) {
      console.error('Failed to fetch playlist videos:', error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      console.log('Deleting video from playlist:', videoToDelete.playlist_video_id);
      
      // Delete from playlist_videos junction table
      const { error } = await supabase
        .from('playlist_videos')
        .delete()
        .eq('id', videoToDelete.playlist_video_id);

      if (error) throw error;

      toast.success("Video removed from playlist");
      
      // Remove from local state
      setVideos(videos.filter(v => v.id !== videoToDelete.id));
      
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to remove video");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Videos</h1>
            <p className="text-sm text-muted-foreground">{playlistName}</p>
          </div>
        </div>

        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No videos in this playlist</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {videos.map((video, index) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">#{index + 1}</span>
                        {video.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Added {new Date(video.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(video)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {videos.length} video{videos.length !== 1 ? 's' : ''} in playlist
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Video?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{videoToDelete?.title}" from this playlist?
              <br /><br />
              This will stop it from playing on devices. The video file will remain in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayerPlaylistManager;
