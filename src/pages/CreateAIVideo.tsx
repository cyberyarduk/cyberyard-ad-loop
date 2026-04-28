import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Settings2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VideoGenerationLoader } from "@/components/VideoGenerationLoader";
import { cn } from "@/lib/utils";

// ===== Customization options =====
const STYLE_PRESETS = [
  { value: "boom", label: "💥 BOOM", description: "Bold explosive impact" },
  { value: "sparkle", label: "✨ Sparkle", description: "Elegant magical shine" },
  { value: "stars", label: "⭐ Stars", description: "Glamorous & fabulous" },
  { value: "minimal", label: "🎯 Minimal", description: "Clean & professional" },
];

// Each font has a CSS family stack so the picker shows what it'll actually look like
const FONT_OPTIONS = [
  { value: "bold-sans", label: "Bold Sans", description: "Strong, modern, attention-grabbing", css: "'Impact', 'Arial Black', system-ui, sans-serif", weight: 900 },
  { value: "elegant-serif", label: "Elegant Serif", description: "Classic, refined, premium feel", css: "'Playfair Display', 'Didot', Georgia, serif", weight: 700 },
  { value: "handwritten", label: "Handwritten Script", description: "Friendly, casual, personal", css: "'Brush Script MT', 'Lucida Handwriting', cursive", weight: 400 },
  { value: "modern-display", label: "Modern Display", description: "Geometric, futuristic", css: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif", weight: 700 },
  { value: "rounded", label: "Rounded Soft", description: "Playful, approachable", css: "'Quicksand', 'Nunito', 'Comic Sans MS', sans-serif", weight: 700 },
  { value: "condensed", label: "Condensed Block", description: "Tall, dense, impactful", css: "'Oswald', 'Bebas Neue', 'Arial Narrow', sans-serif", weight: 800 },
];

const TEXT_COLOR_OPTIONS = [
  { value: "white", label: "White", swatch: "#FFFFFF" },
  { value: "black", label: "Black", swatch: "#000000" },
  { value: "yellow", label: "Yellow", swatch: "#FFD60A" },
  { value: "red", label: "Red", swatch: "#FF3B30" },
  { value: "pink", label: "Hot Pink", swatch: "#FF2D87" },
  { value: "blue", label: "Electric Blue", swatch: "#0A84FF" },
  { value: "green", label: "Lime Green", swatch: "#30D158" },
  { value: "orange", label: "Orange", swatch: "#FF9500" },
];

const OVERLAY_OPTIONS = [
  { value: "none", label: "None", description: "Text floats directly on the image" },
  { value: "solid-band", label: "Solid Band", description: "Colored bar behind the text" },
  { value: "semi-dark", label: "Dark Tint", description: "Semi-transparent dark layer for readability" },
  { value: "semi-light", label: "Light Tint", description: "Semi-transparent light layer" },
  { value: "gradient-bottom", label: "Bottom Fade", description: "Soft gradient fading from the bottom" },
  { value: "gradient-top", label: "Top Fade", description: "Soft gradient fading from the top" },
];

const OVERLAY_COLOR_OPTIONS = [
  { value: "black", label: "Black", swatch: "#000000" },
  { value: "white", label: "White", swatch: "#FFFFFF" },
  { value: "red", label: "Red", swatch: "#FF3B30" },
  { value: "blue", label: "Blue", swatch: "#0A84FF" },
  { value: "yellow", label: "Yellow", swatch: "#FFD60A" },
  { value: "pink", label: "Pink", swatch: "#FF2D87" },
];

const POSITION_OPTIONS = [
  { value: "top", label: "Top", description: "Above the subject" },
  { value: "middle", label: "Middle", description: "Centered" },
  { value: "bottom", label: "Bottom", description: "Below the subject" },
  { value: "infront", label: "In Front", description: "Overlapping the subject" },
  { value: "behind", label: "Behind", description: "Behind the subject" },
];

interface PlaylistOption {
  id: string;
  name: string;
}

const CreateAIVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPlaylistId = searchParams.get("playlistId") || "";
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(presetPlaylistId ? [presetPlaylistId] : []);
  const [mainText, setMainText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [duration, setDuration] = useState("10");
  const [style, setStyle] = useState("boom");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Advanced customization
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fontFamily, setFontFamily] = useState("bold-sans");
  const [textColor, setTextColor] = useState("white");
  const [overlayStyle, setOverlayStyle] = useState("none");
  const [overlayColor, setOverlayColor] = useState("black");
  const [textPosition, setTextPosition] = useState("middle");
  const [themePrompt, setThemePrompt] = useState("");
  const [limitedOffer, setLimitedOffer] = useState(false);
  const [badgeText, setBadgeText] = useState("TODAY ONLY");
  const [animatedOverlays, setAnimatedOverlays] = useState(true);

  // Fetch playlists on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          toast.error(`Authentication failed: ${userError.message}`);
          return;
        }
        if (!user) {
          toast.error("Not logged in. Redirecting...");
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        const { data, error } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          toast.error(`Cannot load playlists: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          toast.error("No playlists exist. Go to Playlists page and create one first.");
          setPlaylists([]);
          return;
        }

        setPlaylists(data);
        if (presetPlaylistId && data.some((p) => p.id === presetPlaylistId)) {
          setSelectedPlaylistIds([presetPlaylistId]);
        } else if (selectedPlaylistIds.length === 0) {
          setSelectedPlaylistIds([data[0].id]);
        }
      } catch (err) {
        toast.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetPlaylistId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainText.trim()) return toast.error("Please enter main text for your video.");
    if (!imageFile) return toast.error("Please upload an image for your video.");
    if (selectedPlaylistIds.length === 0) return toast.error("Please select at least one playlist.");
    if (themePrompt.length > 200) return toast.error("Theme prompt must be 200 characters or less.");

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 0 || durationNum > 600) {
      return toast.error("Duration must be between 0 and 600 seconds.");
    }

    setIsGenerating(true);

    try {
      toast.info("Uploading image...");

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `offer-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);

      toast.info("Starting video generation. This may take 1-2 minutes...");

      const firstPlaylistId = selectedPlaylistIds[0] || null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          imageUrl: publicUrl,
          mainText,
          subtext,
          duration,
          style,
          playlistId: firstPlaylistId,
          limitedOffer,
          badgeText: limitedOffer ? badgeText.trim() : undefined,
          animatedOverlays,
          customization: {
            fontFamily,
            textColor,
            overlayStyle,
            overlayColor,
            textPosition,
            themePrompt: themePrompt.trim(),
          },
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Video generation failed");

      if (data?.success) {
        const extraPlaylistIds = selectedPlaylistIds.slice(1);
        if (extraPlaylistIds.length > 0 && data.video?.id) {
          const rows = extraPlaylistIds.map((pid) => ({
            playlist_id: pid,
            video_id: data.video.id,
            order_index: 0,
          }));
          const { error: insertError } = await supabase.from('playlist_videos').insert(rows);
          if (insertError) {
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

        <Card>
          <CardHeader>
            <CardTitle>Create your video</CardTitle>
            <CardDescription>
              Upload an image and add your offer text to create a video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Playlists */}
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
                                value ? [...prev, playlist.id] : prev.filter((id) => id !== playlist.id)
                              );
                            }}
                          />
                          <Label htmlFor={`pl-${playlist.id}`} className="font-normal cursor-pointer">
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

              {/* Image */}
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
                    <img src={imagePreview} alt="Preview" className="w-full max-w-xs rounded-lg border" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Upload a photo (e.g., blueberry muffins)</p>
              </div>

              {/* Main text */}
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

              {/* Subtext / Price */}
              <div className="space-y-2">
                <Label htmlFor="subtext">Price or Subtext (Optional)</Label>
                <Textarea
                  id="subtext"
                  placeholder="ONLY £4.99"
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Shown as a bold yellow badge that pops in mid-video. Leave blank to skip.
                </p>
              </div>

              {/* Limited offer toggle */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="limitedOffer"
                    checked={limitedOffer}
                    onCheckedChange={(v) => setLimitedOffer(v === true)}
                  />
                  <Label htmlFor="limitedOffer" className="cursor-pointer font-medium">
                    This is a limited time offer
                  </Label>
                </div>
                {limitedOffer && (
                  <div className="ml-7 space-y-1">
                    <Label htmlFor="badgeText" className="text-xs text-muted-foreground">Badge text</Label>
                    <Input
                      id="badgeText"
                      placeholder="TODAY ONLY"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value.slice(0, 20))}
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">A pulsing red badge will appear near the top. Max 20 chars.</p>
                  </div>
                )}
                {!limitedOffer && (
                  <p className="ml-7 text-xs text-muted-foreground">No badge will be shown — keeps the advert truthful.</p>
                )}
              </div>

              {/* Animated overlays toggle */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="animatedOverlays"
                    checked={animatedOverlays}
                    onCheckedChange={(v) => setAnimatedOverlays(v === true)}
                  />
                  <Label htmlFor="animatedOverlays" className="cursor-pointer font-medium">
                    Add animated overlays (swiping bars, pulsing badge)
                  </Label>
                </div>
                <p className="ml-7 text-xs text-muted-foreground">
                  {animatedOverlays
                    ? "Adds motion effects on top of the poster — great for offers."
                    : "Clean & still — perfect for menus or static information."}
                </p>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Select your duration</Label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="10">10 seconds</option>
                    <option value="15">15 seconds</option>
                    <option value="20">20 seconds</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Style Preset</Label>
                  <select
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    {STYLE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label} — {p.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme prompt */}
              <div className="space-y-2">
                <Label htmlFor="themePrompt">
                  Theme / Vibe (Optional)
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    {themePrompt.length}/200
                  </span>
                </Label>
                <Textarea
                  id="themePrompt"
                  placeholder="e.g. stars, boom, exciting, summer vibes, retro 80s, fresh & bright..."
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Add a few words to influence the mood. Up to 200 characters.
                </p>
              </div>

              {/* Advanced toggle + Decide For Me */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced((s) => !s)}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  {showAdvanced ? "Hide advanced" : "Show advanced"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
                    setFontFamily(pick(FONT_OPTIONS).value);
                    setTextColor(pick(TEXT_COLOR_OPTIONS).value);
                    setTextPosition(pick(POSITION_OPTIONS).value);
                    setOverlayStyle(pick(OVERLAY_OPTIONS).value);
                    setOverlayColor(pick(OVERLAY_COLOR_OPTIONS).value);
                    setStyle(pick(STYLE_PRESETS).value);
                    toast.success("Cyberyard picked a style for you ✨");
                    setShowAdvanced(true);
                  }}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Decide For Me
                </Button>
              </div>

              {/* Advanced section */}
              {showAdvanced && (
                <div className="space-y-6 rounded-md border p-4 bg-muted/30">
                  {/* Font - visual preview grid */}
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setFontFamily(f.value)}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                            fontFamily === f.value ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/50"
                          )}
                        >
                          <span
                            className="text-2xl leading-none"
                            style={{ fontFamily: f.css, fontWeight: f.weight }}
                          >
                            {mainText.trim().slice(0, 12) || "Aa Bb 99p"}
                          </span>
                          <span className="text-xs font-medium">{f.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{f.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text color */}
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {TEXT_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setTextColor(c.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                            textColor === c.value ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                          )}
                        >
                          <span
                            className="h-6 w-6 rounded-full border border-border"
                            style={{ backgroundColor: c.swatch }}
                          />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text position */}
                  <div className="space-y-2">
                    <Label>Text Position</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {POSITION_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setTextPosition(p.value)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 rounded-md border p-2 text-sm transition-colors",
                            textPosition === p.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="font-medium">{p.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight text-center">{p.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>


                  {/* Overlay style */}
                  <div className="space-y-2">
                    <Label htmlFor="overlayStyle">Text Background / Overlay</Label>
                    <select
                      id="overlayStyle"
                      value={overlayStyle}
                      onChange={(e) => setOverlayStyle(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {OVERLAY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label} — {o.description}</option>
                      ))}
                    </select>
                  </div>

                  {/* Overlay color (only when relevant) */}
                  {overlayStyle !== "none" && (
                    <div className="space-y-2">
                      <Label>Overlay Color</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {OVERLAY_COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setOverlayColor(c.value)}
                            className={cn(
                              "flex items-center gap-2 rounded-md border p-2 text-xs transition-colors",
                              overlayColor === c.value ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                            )}
                          >
                            <span
                              className="h-5 w-5 rounded-full border border-border"
                              style={{ backgroundColor: c.swatch }}
                            />
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
