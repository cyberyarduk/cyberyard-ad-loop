import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Video, Edit, Trash2, Sparkles, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Videos = () => {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);

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

  const handleRegenerate = async (video: any) => {
    if (!video.ai_prompt || !video.ai_image_url) {
      toast.error("Cannot regenerate: missing original prompt data");
      return;
    }

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
          style: video.ai_style || 'boom'
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to regenerate');

      toast.success("Video regenerated successfully");
      fetchVideos();
    } catch (error: any) {
      console.error('Regenerate error:', error);
      toast.error(error.message || "Failed to regenerate video");
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Videos</h1>
            <p className="text-muted-foreground mt-1">
              Manage your video content library
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/videos/create-ai">
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Offer Video
              </Button>
            </Link>
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
            <h3 className="mt-4 text-lg font-semibold">No videos yet</h3>
            <p className="text-muted-foreground mt-2">
              Upload your first video or create one with AI
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    {video.source === 'ai_generated' ? (
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Manual Upload
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(video.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {video.source === 'ai_generated' && video.ai_prompt && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRegenerate(video)}
                        disabled={regenerating === video.id}
                        title="Regenerate video"
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerating === video.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                    >
                      <a href={video.video_url} download={`${video.title}.mp4`}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const videoElement = document.createElement('video');
                        videoElement.src = video.video_url;
                        videoElement.controls = true;
                        videoElement.style.width = '100%';
                        videoElement.style.maxWidth = '600px';
                        
                        const dialog = document.createElement('div');
                        dialog.style.position = 'fixed';
                        dialog.style.top = '50%';
                        dialog.style.left = '50%';
                        dialog.style.transform = 'translate(-50%, -50%)';
                        dialog.style.backgroundColor = 'black';
                        dialog.style.padding = '20px';
                        dialog.style.borderRadius = '8px';
                        dialog.style.zIndex = '9999';
                        dialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
                        
                        const closeBtn = document.createElement('button');
                        closeBtn.textContent = '×';
                        closeBtn.style.position = 'absolute';
                        closeBtn.style.top = '10px';
                        closeBtn.style.right = '10px';
                        closeBtn.style.background = 'rgba(255,255,255,0.2)';
                        closeBtn.style.color = 'white';
                        closeBtn.style.border = 'none';
                        closeBtn.style.fontSize = '24px';
                        closeBtn.style.cursor = 'pointer';
                        closeBtn.style.width = '30px';
                        closeBtn.style.height = '30px';
                        closeBtn.style.borderRadius = '50%';
                        
                        const backdrop = document.createElement('div');
                        backdrop.style.position = 'fixed';
                        backdrop.style.top = '0';
                        backdrop.style.left = '0';
                        backdrop.style.width = '100%';
                        backdrop.style.height = '100%';
                        backdrop.style.backgroundColor = 'rgba(0,0,0,0.8)';
                        backdrop.style.zIndex = '9998';
                        
                        const closeDialog = () => {
                          document.body.removeChild(dialog);
                          document.body.removeChild(backdrop);
                        };
                        
                        closeBtn.onclick = closeDialog;
                        backdrop.onclick = closeDialog;
                        
                        dialog.appendChild(closeBtn);
                        dialog.appendChild(videoElement);
                        document.body.appendChild(backdrop);
                        document.body.appendChild(dialog);
                      }}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(video.id, video.video_url)}
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
    </DashboardLayout>
  );
};

export default Videos;