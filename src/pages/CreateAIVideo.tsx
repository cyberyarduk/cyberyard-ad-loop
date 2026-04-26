import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VideoGenerationLoader } from "@/components/VideoGenerationLoader";
import { CreditsBalanceCard } from "@/components/CreditsBalanceCard";
import { useCredits, VIDEO_GENERATION_COST } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";

const CreateAIVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPlaylistId = searchParams.get("playlistId") || "";
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(presetPlaylistId ? [presetPlaylistId] : []);
  const [mainText, setMainText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [duration, setDuration] = useState("10");
  const [style, setStyle] = useState("boom");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { total: availableCredits, hasEnough, deductCredits, loading: creditsLoading } = useCredits();
  const { profile } = useAuth();

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
        // Honor preset from query param if it matches an existing playlist
        if (presetPlaylistId && data.some((p) => p.id === presetPlaylistId)) {
          setSelectedPlaylistIds([presetPlaylistId]);
        } else if (selectedPlaylistIds.length === 0) {
          setSelectedPlaylistIds([data[0].id]);
        }
      } catch (err) {
        console.error("Unexpected error in fetchPlaylists:", err);
        toast.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    fetchPlaylists();
  }, [presetPlaylistId]);

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

    if (selectedPlaylistIds.length === 0) {
      toast.error("Please select at least one playlist.");
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 0 || durationNum > 600) {
      toast.error("Duration must be between 0 and 600 seconds.");
      return;
    }

    if (!hasEnough(VIDEO_GENERATION_COST)) {
      toast.error(`Not enough credits. You need ${VIDEO_GENERATION_COST} credits to generate a video.`);
      return;
    }

    // Deduct credits before generation
    const deductResult = await deductCredits(VIDEO_GENERATION_COST, `Video: ${mainText}`);
    if (!deductResult.success) {
      toast.error(deductResult.error || "Could not deduct credits. Please try again.");
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
      
      const firstPlaylistId = selectedPlaylistIds[0] || null;
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          imageUrl: publicUrl,
          mainText,
          subtext,
          duration,
          style,
          playlistId: firstPlaylistId,
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Add the new video to any additional selected playlists
        const extraPlaylistIds = selectedPlaylistIds.slice(1);
        if (extraPlaylistIds.length > 0 && data.video?.id) {
          const rows = extraPlaylistIds.map((pid) => ({
            playlist_id: pid,
            video_id: data.video.id,
            order_index: 0,
          }));
          const { error: insertError } = await supabase.from('playlist_videos').insert(rows);
          if (insertError) {
            console.error('Failed to add video to extra playlists:', insertError);
            toast.error('Video created, but could not add to all selected playlists.');
          }
        }
        toast.success("Video generated successfully!");
        navigate("/videos");
      } else {
        throw new Error(data?.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      // Refund credits on failure
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && profile?.company_id) {
          const { data: current } = await supabase
            .from("company_credits")
            .select("purchased_credits")
            .eq("company_id", profile.company_id)
            .maybeSingle();
          await supabase
            .from("company_credits")
            .update({ purchased_credits: (current?.purchased_credits ?? 0) + VIDEO_GENERATION_COST })
            .eq("company_id", profile.company_id);
          await supabase.from("credit_transactions").insert({
            company_id: profile.company_id,
            user_id: user.id,
            amount: VIDEO_GENERATION_COST,
            transaction_type: "admin_adjustment",
            description: "Refund for failed video generation",
          });
        }
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
      }
      toast.error(error instanceof Error ? error.message : "Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <VideoGenerationLoader open={isGenerating} />
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2 h-8 w-8 text-primary" />
            Create Offer Video
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate promotional videos instantly
          </p>
        </div>

        <CreditsBalanceCard highlightLow />

        <Card>
          <CardHeader>
            <CardTitle>Create your video</CardTitle>
            <CardDescription>
              Upload an image and add your offer text to create a video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Target Playlists</Label>
                {playlists.length === 0 ? (
                  <p className="text-sm text-muted-foreground border rounded-md p-3">
                    No playlists available. Create one on the Playlists page first.
                  </p>
                ) : (
                  <div className="border rounded-md p-3 space-y-2 max-h-56 overflow-y-auto">
                    {playlists.map((playlist) => {
                      const checked = selectedPlaylistIds.includes(playlist.id);
                      return (
                        <div key={playlist.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`pl-${playlist.id}`}
                            checked={checked}
                            onCheckedChange={(value) => {
                              setSelectedPlaylistIds((prev) =>
                                value
                                  ? [...prev, playlist.id]
                                  : prev.filter((id) => id !== playlist.id)
                              );
                            }}
                          />
                          <Label
                            htmlFor={`pl-${playlist.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {playlist.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Select one or more playlists. The video will be added to each.
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
                  <Label htmlFor="duration">Select your duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    max={600}
                    step={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    0–600 seconds
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Video Style</Label>
                  <select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="boom">💥 BOOM - Bold Explosion</option>
                    <option value="sparkle">✨ Sparkle - Elegant Shine</option>
                    <option value="stars">⭐ Stars - Magical</option>
                    <option value="minimal">🎯 Minimal - Clean</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating || creditsLoading || !hasEnough(VIDEO_GENERATION_COST)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : !hasEnough(VIDEO_GENERATION_COST) ? (
                  <>Not enough credits</>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video ({VIDEO_GENERATION_COST} credits)
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