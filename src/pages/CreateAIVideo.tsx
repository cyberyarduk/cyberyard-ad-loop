import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const CreateAIVideo = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlistId, setPlaylistId] = useState("");
  const [mainText, setMainText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [duration, setDuration] = useState("10");
  const [theme, setTheme] = useState("dark");
  const [music, setMusic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    // TODO: Replace this mock logic with actual AI video generation API
    // For now, simulating the generation process
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // TODO: Call edge function to generate video
      // const response = await fetch('/api/ai/generate-offer-video', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     image: imageFile,
      //     mainText,
      //     subtext,
      //     duration,
      //     theme,
      //     music,
      //     playlistId
      //   })
      // });

      toast.success("AI video generated successfully!");
      navigate("/videos");
    } catch (error) {
      toast.error("Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2 h-8 w-8 text-primary" />
            Quick Offer Video Creator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate promotional videos instantly with AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
            <CardDescription>
              Upload an image and add your offer text to create a video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playlist">Target Playlist</Label>
                <Select value={playlistId} onValueChange={setPlaylistId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Playlist</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Video will be added to the beginning of this playlist
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Upload a photo (e.g., blueberry muffins)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainText">Main Offer Text</Label>
                <Input
                  id="mainText"
                  placeholder="Blueberry Muffins – 50% OFF"
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtext">Subtext (Optional)</Label>
                <Textarea
                  id="subtext"
                  placeholder="Until 5pm today"
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="music"
                  checked={music}
                  onCheckedChange={setMusic}
                />
                <Label htmlFor="music">Background Music</Label>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This feature uses AI to generate videos.
                  The generated video will be in 9:16 portrait format, perfect for
                  wearable screens. Currently using mock generation - ready to connect
                  to your preferred AI video generation API.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateAIVideo;