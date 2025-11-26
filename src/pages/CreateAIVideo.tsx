import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const CreateAIVideo = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [mainText, setMainText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [duration, setDuration] = useState("10");
  const [style, setStyle] = useState("boom");
  const [music, setMusic] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Fetch playlists on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        console.log('CreateAIVideo: Starting playlist fetch...');
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Auth error:", userError);
          toast.error(`Authentication failed: ${userError.message}`);
          return;
        }
        
        if (!user) {
          console.log('No authenticated user found');
          toast.error("Not logged in. Redirecting...");
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        console.log('User authenticated, ID:', user.id);

        const { data, error } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Playlist fetch error:", error);
          toast.error(`Cannot load playlists: ${error.message}`);
          return;
        }

        console.log('Playlists retrieved:', data?.length || 0);
        
        if (!data || data.length === 0) {
          toast.error("No playlists exist. Go to Playlists page and create one first.");
          setPlaylists([]);
          return;
        }
        
        setPlaylists(data);
        setPlaylistId(data[0].id);
        toast.success(`Ready! ${data.length} playlist(s) available`);
      } catch (err) {
        console.error("Unexpected error in fetchPlaylists:", err);
        toast.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    fetchPlaylists();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mainText.trim()) {
      toast.error("Please enter main text for your video.");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload an image for your video.");
      return;
    }

    setIsGenerating(true);

    try {
      toast.info("Uploading image...");
      
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `offer-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      toast.info("Starting video generation. This may take 1-2 minutes...");
      
      const { data, error} = await supabase.functions.invoke('generate-video', {
        body: {
          imageUrl: publicUrl,
          mainText,
          subtext,
          duration,
          style,
          playlistId: playlistId || null
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Video generated successfully!");
        navigate("/videos");
      } else {
        throw new Error(data?.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate video. Please try again.");
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
                  <SelectContent className="z-[100] bg-background">
                    {playlists.length === 0 ? (
                      <SelectItem value="none" disabled>No playlists available</SelectItem>
                    ) : (
                      playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))
                    )}
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
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-w-xs rounded-lg border"
                    />
                  </div>
                )}
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
                  <Label htmlFor="style">Video Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boom">💥 BOOM - Bold Explosion</SelectItem>
                      <SelectItem value="sparkle">✨ Sparkle - Elegant Shine</SelectItem>
                      <SelectItem value="stars">⭐ Stars - Magical</SelectItem>
                      <SelectItem value="minimal">🎯 Minimal - Clean</SelectItem>
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
                  <strong>Note:</strong> This feature uses Shotstack AI to generate real videos.
                  The generated video will be in 9:16 portrait format, perfect for
                  vertical displays. Generation typically takes 1-2 minutes.
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