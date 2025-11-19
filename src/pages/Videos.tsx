import { useState } from "react";
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
import { Plus, Video, Edit, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Videos = () => {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement file upload with Supabase Storage
    const newVideo = {
      id: crypto.randomUUID(),
      title,
      description,
      file_url: "https://example.com/video.mp4", // Placeholder
      thumbnail_url: null,
      is_active: isActive,
      source_type: "upload",
      created_at: new Date().toISOString(),
    };
    setVideos([...videos, newVideo]);
    toast.success("Video uploaded successfully");
    setOpen(false);
    setTitle("");
    setDescription("");
    setIsActive(true);
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
                      accept="video/mp4"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 9:16 portrait orientation for wearable screens
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
                  <Button type="submit" className="w-full">
                    Upload Video
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {videos.length === 0 ? (
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
                    {video.source_type === "ai_generated" ? (
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline">Upload</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {video.is_active ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(video.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
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