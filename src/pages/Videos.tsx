import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Video, Trash2, Sparkles, RefreshCw, Clock, Play, Image as ImageIcon } from "lucide-react";
import { generateOrientedVariants } from "@/lib/imageOrient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PlaylistSelectorDialog } from "@/components/PlaylistSelectorDialog";

const Videos = () => {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<any | null>(null);
  const [durationEdit, setDurationEdit] = useState<{ id: string; value: string } | null>(null);
  const [savingDuration, setSavingDuration] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Image upload state
  const [imageOpen, setImageOpen] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDuration, setImageDuration] = useState<string>("10");
  const [uploadingImage, setUploadingImage] = useState(false);
  // Player-side overlay choice — rendered live by the player on top of
  // the static image (no Shotstack render, no extra cost).
  // 'none' = pure menu/poster, 'stars' / 'sparkles' / 'shimmer' = live effect.
  const [imgPlayerOverlay, setImgPlayerOverlay] = useState<"none" | "stars" | "sparkles" | "shimmer">("none");

  // Playlist selector — shared by image upload + AI regenerate flows.
  // We stash the pending action and re-run it once the user picks a playlist.
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "image_upload" }
    | { type: "regenerate"; video: any }
    | null
  >(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      // Upload file to storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Insert video record
      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          title,
          video_url: publicUrl,
          user_id: user.id,
          company_id: profile?.company_id,
        });

      if (insertError) throw insertError;

      toast.success("Video uploaded successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setIsActive(true);
      setVideoFile(null);
      fetchVideos();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  // Step 1: validate the form, then ask which playlist to drop the image into.
  // The actual upload happens in `uploadImageToPlaylist` once the user picks one.
  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }
    const dur = parseInt(imageDuration, 10);
    if (!dur || dur < 1 || dur > 600) {
      toast.error("Display time must be 1–600 seconds");
      return;
    }
    setPendingAction({ type: "image_upload" });
    setPlaylistPickerOpen(true);
  };

  const uploadImageToPlaylist = async (playlistId: string) => {
    if (!imageFile) return;
    const dur = parseInt(imageDuration, 10);
    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      toast.info("Optimising image for every screen…");
      const { portraitBlob, landscapeBlob } = await generateOrientedVariants(imageFile);

      const stamp = Date.now();
      const portraitPath = `${user.id}/${stamp}-portrait.jpg`;
      const landscapePath = `${user.id}/${stamp}-landscape.jpg`;

      const [pUp, lUp] = await Promise.all([
        supabase.storage.from("images").upload(portraitPath, portraitBlob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        }),
        supabase.storage.from("images").upload(landscapePath, landscapeBlob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        }),
      ]);
      if (pUp.error) throw pUp.error;
      if (lUp.error) throw lUp.error;

      const portraitUrl = supabase.storage.from("images").getPublicUrl(portraitPath).data.publicUrl;
      const landscapeUrl = supabase.storage.from("images").getPublicUrl(landscapePath).data.publicUrl;

      const { data: inserted, error: insertError } = await supabase
        .from("videos")
        .insert({
          title: imageTitle || imageFile.name,
          user_id: user.id,
          company_id: profile?.company_id,
          media_type: "image",
          image_url: portraitUrl,
          image_url_landscape: landscapeUrl,
          video_url: portraitUrl,
          display_duration: dur,
          source: "image_upload",
          player_overlay: imgPlayerOverlay,
        } as any)
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Append to chosen playlist
      const { data: existingVideos } = await supabase
        .from("playlist_videos")
        .select("order_index")
        .eq("playlist_id", playlistId)
        .order("order_index", { ascending: false })
        .limit(1);
      const nextOrder = existingVideos && existingVideos.length > 0
        ? existingVideos[0].order_index + 1
        : 0;
      const { error: linkErr } = await supabase
        .from("playlist_videos")
        .insert({ playlist_id: playlistId, video_id: inserted!.id, order_index: nextOrder });
      if (linkErr) throw linkErr;

      toast.success("Image uploaded and added to playlist");

      setImageOpen(false);
      setImageTitle("");
      setImageFile(null);
      setImageDuration("10");
      setImgPlayerOverlay("none");
      fetchVideos();
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (videoId: string, videoUrl: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split('/storage/v1/object/public/videos/');
      const filePath = urlParts[1];

      // Delete from storage if file path exists
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove([filePath]);

        if (storageError) console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      toast.success("Video deleted successfully");
      fetchVideos();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || "Failed to delete video");
    }
  };

  const handleRegenerate = (video: any) => {
    if (!video.ai_prompt || !video.ai_image_url) {
      toast.error("Cannot regenerate: missing original prompt data");
      return;
    }
    // Ask which playlist the regenerated video should go into.
    setPendingAction({ type: "regenerate", video });
    setPlaylistPickerOpen(true);
  };

  const regenerateIntoPlaylist = async (video: any, playlistId: string) => {
    setRegenerating(video.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          imageUrl: video.ai_image_url,
          mainText: video.ai_prompt,
          duration: video.ai_duration || '5',
          style: video.ai_style || 'boom',
          playlistId,
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to regenerate');

      toast.success("Video regenerated and added to playlist");
      fetchVideos();
    } catch (error: any) {
      console.error('Regenerate error:', error);
      toast.error(error.message || "Failed to regenerate video");
    } finally {
      setRegenerating(null);
    }
  };

  const handlePlaylistChosen = (playlistId: string) => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === "image_upload") {
      uploadImageToPlaylist(playlistId);
    } else if (action.type === "regenerate") {
      regenerateIntoPlaylist(action.video, playlistId);
    }
  };

  const saveDuration = async () => {
    if (!durationEdit) return;
    setSavingDuration(true);
    try {
      const trimmed = durationEdit.value.trim();
      const parsed = trimmed === "" ? null : Math.max(1, Math.min(600, parseInt(trimmed, 10)));
      if (trimmed !== "" && (parsed === null || isNaN(parsed))) {
        toast.error("Enter a number between 1 and 600 seconds");
        return;
      }
      const { error } = await supabase
        .from("videos")
        .update({ display_duration: parsed })
        .eq("id", durationEdit.id);
      if (error) throw error;
      toast.success(parsed ? `Duration set to ${parsed}s` : "Using default duration");
      setDurationEdit(null);
      fetchVideos();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save duration");
    } finally {
      setSavingDuration(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and images in one library
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/videos/create-ai">
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Offer Video
              </Button>
            </Link>
            <Dialog open={imageOpen} onOpenChange={setImageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload an image</DialogTitle>
                  <DialogDescription>
                    Add a menu, promo or any picture. We'll auto-resize it for
                    every screen — phones play it portrait, TVs play it landscape.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleImageSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="img-title">Title</Label>
                    <Input
                      id="img-title"
                      placeholder="Lunch menu"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="img-file">Image (JPG or PNG)</Label>
                    <Input
                      id="img-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="img-duration">Display time (seconds)</Label>
                    <Input
                      id="img-duration"
                      type="number"
                      min={1}
                      max={600}
                      value={imageDuration}
                      onChange={(e) => setImageDuration(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      How long the image stays on screen before the next item plays.
                    </p>
                  </div>
                  {/* Player overlay picker — a live effect rendered by the
                      player on top of the static image. Free; no render cost. */}
                  <div className="space-y-2">
                    <Label className="text-sm">Player overlay</Label>
                    <p className="text-xs text-muted-foreground">
                      Pick a live effect the player draws over your image. Choose
                      "None" for a plain menu board.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: "none", label: "None (plain)" },
                        { v: "stars", label: "Golden stars" },
                        { v: "sparkles", label: "Sparkles" },
                        { v: "shimmer", label: "Shimmer sweep" },
                      ].map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setImgPlayerOverlay(o.v as any)}
                          className={`text-xs px-3 py-2 rounded border transition ${
                            imgPlayerOverlay === o.v
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={uploadingImage}>
                    {uploadingImage ? "Uploading…" : "Upload Image"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Video</DialogTitle>
                  <DialogDescription>
                    Add a new video to your content library
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Summer Sale Announcement"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Details about this video..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Video File (MP4)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 9:16 portrait orientation for device screens
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Video"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Video className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No media yet</h3>
            <p className="text-muted-foreground mt-2">
              Upload your first video or create one with AI
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden border border-border shadow-sm">
                <button
                  type="button"
                  onClick={() => setPreviewVideo(video)}
                  className="block w-full aspect-[9/16] bg-muted relative group"
                  aria-label={`Preview ${video.title}`}
                >
                  {video.media_type === 'image' ? (
                    <img
                      src={video.image_url || video.video_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={video.video_url}
                      poster={video.image_url || undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-10 w-10 text-foreground" />
                  </div>
                </button>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{video.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {video.media_type === 'image' ? (
                      <Badge variant="secondary" className="shrink-0">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Image
                      </Badge>
                    ) : video.source === 'ai_generated' ? (
                      <Badge variant="secondary" className="shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">Upload</Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDurationEdit({ id: video.id, value: video.display_duration?.toString() ?? "" })}
                    className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-3 py-2 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">
                      {video.display_duration
                        ? `Plays for ${video.display_duration}s`
                        : video.media_type === 'image'
                          ? 'Set display time'
                          : 'Use video length'}
                    </span>
                    <span className="text-primary font-medium">Edit</span>
                  </button>

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div className="flex gap-1">
                      {video.source === 'ai_generated' && video.ai_prompt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(video)}
                          disabled={regenerating === video.id}
                          title="Regenerate"
                        >
                          <RefreshCw className={`h-4 w-4 ${regenerating === video.id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(video.id, video.video_url)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewVideo} onOpenChange={(o) => !o && setPreviewVideo(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="truncate">{previewVideo?.title}</DialogTitle>
            </DialogHeader>
            {previewVideo && (
              <div className="aspect-[9/16] bg-muted">
                {previewVideo.media_type === 'image' ? (
                  <img
                    src={previewVideo.image_url || previewVideo.video_url}
                    alt={previewVideo.title}
                    className="w-full h-full object-contain bg-background"
                  />
                ) : (
                  <video
                    src={previewVideo.video_url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-background"
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Duration Dialog */}
        <Dialog open={!!durationEdit} onOpenChange={(o) => !o && setDurationEdit(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set display duration</DialogTitle>
              <DialogDescription>
                Override how long this video stays on screen during playback.
                Useful for menus or static images. Leave blank to use the video's
                own length.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="duration">Seconds</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={600}
                placeholder="e.g. 30"
                value={durationEdit?.value ?? ""}
                onChange={(e) =>
                  setDurationEdit((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                }
              />
              <p className="text-xs text-muted-foreground">Between 1 and 600 seconds.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDurationEdit(null)} disabled={savingDuration}>
                Cancel
              </Button>
              <Button onClick={saveDuration} disabled={savingDuration}>
                {savingDuration ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Videos;