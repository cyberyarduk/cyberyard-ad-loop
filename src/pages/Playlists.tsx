import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, List, Edit, Trash2, ArrowUp, ArrowDown, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

const Playlists = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [addVideosOpen, setAddVideosOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlaylists();
    fetchVideos();
  };

  const fetchPlaylists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: playlistsData, error: playlistsError } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (playlistsError) {
      toast.error("Failed to load playlists");
      return;
    }

    const playlistsWithVideos = await Promise.all(
      (playlistsData || []).map(async (playlist) => {
        const { data: playlistVideos } = await supabase
          .from("playlist_videos")
          .select(`
            id,
            order_index,
            videos (
              id,
              title,
              video_url
            )
          `)
          .eq("playlist_id", playlist.id)
          .order("order_index");

        return {
          ...playlist,
          videos: playlistVideos?.map(pv => pv.videos) || [],
        };
      })
    );

    setPlaylists(playlistsWithVideos);
  };

  const fetchVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load videos");
      return;
    }

    setVideos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { error } = await supabase
      .from("playlists")
      .insert({
        name,
        user_id: user.id,
        company_id: profile?.company_id,
      });

    if (error) {
      toast.error("Failed to create playlist");
      return;
    }

    toast.success("Playlist created successfully");
    setOpen(false);
    setName("");
    fetchPlaylists();
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

    if (error) {
      toast.error("Failed to delete playlist");
      return;
    }

    toast.success("Playlist deleted");
    fetchPlaylists();
  };

  const handleAddVideos = async () => {
    if (!selectedPlaylist || selectedVideos.length === 0) return;

    const { data: existingVideos } = await supabase
      .from("playlist_videos")
      .select("order_index")
      .eq("playlist_id", selectedPlaylist)
      .order("order_index", { ascending: false })
      .limit(1);

    const startIndex = existingVideos && existingVideos.length > 0 
      ? existingVideos[0].order_index + 1 
      : 0;

    const playlistVideos = selectedVideos.map((videoId, index) => ({
      playlist_id: selectedPlaylist,
      video_id: videoId,
      order_index: startIndex + index,
    }));

    const { error } = await supabase
      .from("playlist_videos")
      .insert(playlistVideos);

    if (error) {
      toast.error("Failed to add videos to playlist");
      return;
    }

    toast.success(`Added ${selectedVideos.length} video(s) to playlist`);
    setAddVideosOpen(false);
    setSelectedVideos([]);
    setSelectedPlaylist(null);
    fetchPlaylists();
  };

  const handlePushToDevice = async (playlistId: string, playlistName: string) => {
    // Fetch devices for selection
    const { data: devices } = await supabase
      .from("devices")
      .select("*")
      .order("name");

    if (!devices || devices.length === 0) {
      toast.error("No devices available");
      return;
    }

    // Show device selection dialog
    const deviceId = prompt(
      `Push "${playlistName}" to device:\n\n${devices.map((d, i) => `${i + 1}. ${d.name} (${d.device_code})`).join("\n")}\n\nEnter device number:`
    );

    if (!deviceId) return;

    const deviceIndex = parseInt(deviceId) - 1;
    if (deviceIndex < 0 || deviceIndex >= devices.length) {
      toast.error("Invalid device selection");
      return;
    }

    const selectedDevice = devices[deviceIndex];

    const { error } = await supabase
      .from("devices")
      .update({ playlist_id: playlistId })
      .eq("id", selectedDevice.id);

    if (error) {
      toast.error("Failed to push playlist to device");
      return;
    }

    toast.success(`Pushed "${playlistName}" to ${selectedDevice.name}`);
  };

  const handleRemoveVideo = async (playlistId: string, videoId: string) => {
    const { error } = await supabase
      .from("playlist_videos")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId);

    if (error) {
      toast.error("Failed to remove video");
      return;
    }

    toast.success("Video removed from playlist");
    fetchPlaylists();
  };

  const handleReorder = async (playlistId: string, videoId: string, direction: "up" | "down") => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const currentIndex = playlist.videos.findIndex((v: any) => v.id === videoId);
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === playlist.videos.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const { data: playlistVideos } = await supabase
      .from("playlist_videos")
      .select("id, video_id, order_index")
      .eq("playlist_id", playlistId)
      .order("order_index");

    if (!playlistVideos) return;

    const currentVideo = playlistVideos[currentIndex];
    const swapVideo = playlistVideos[newIndex];

    await supabase
      .from("playlist_videos")
      .update({ order_index: swapVideo.order_index })
      .eq("id", currentVideo.id);

    await supabase
      .from("playlist_videos")
      .update({ order_index: currentVideo.order_index })
      .eq("id", swapVideo.id);

    fetchPlaylists();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage video playlists
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Create a playlist to organize your videos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Promotions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Playlist
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <List className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No playlists yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first playlist to organize videos
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="border border-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{playlist.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {playlist.videos.length} videos
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPlaylist(playlist.id);
                        setAddVideosOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Videos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePushToDevice(playlist.id, playlist.name)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Push to Device
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(playlist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {playlist.videos.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded">
                    <p className="text-muted-foreground">
                      No videos in this playlist yet
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playlist.videos.map((video: any, index: number) => (
                        <TableRow key={video.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {video.title}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReorder(playlist.id, video.id, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReorder(playlist.id, video.id, "down")}
                              disabled={index === playlist.videos.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveVideo(playlist.id, video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={addVideosOpen} onOpenChange={setAddVideosOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Videos to Playlist</DialogTitle>
              <DialogDescription>
                Select videos to add to this playlist
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {videos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No videos available. Create some videos first!
                </p>
              ) : (
                videos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={video.id}
                      checked={selectedVideos.includes(video.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVideos([...selectedVideos, video.id]);
                        } else {
                          setSelectedVideos(selectedVideos.filter(id => id !== video.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={video.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {video.title}
                    </label>
                  </div>
                ))
              )}
            </div>
            <Button 
              onClick={handleAddVideos} 
              disabled={selectedVideos.length === 0}
              className="w-full"
            >
              Add {selectedVideos.length} Video(s)
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Playlists;