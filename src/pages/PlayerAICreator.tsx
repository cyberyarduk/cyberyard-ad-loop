import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface PlayerAICreatorProps {
  authToken: string;
  deviceInfo: any;
  onBack: () => void;
  onComplete: () => void;
}

const PlayerAICreator = ({ authToken, deviceInfo, onBack, onComplete }: PlayerAICreatorProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mainText, setMainText] = useState("");
  const [subtext, setSubtext] = useState("");
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async () => {
    // Check if running on native platform
    if (!Capacitor.isNativePlatform()) {
      // Fallback to file input on web
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    try {
      // Use native camera
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error("Failed to capture photo");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!capturedImage) {
      toast.error("Please capture an image first");
      return;
    }

    if (!mainText.trim()) {
      toast.error("Please enter the main offer text");
      return;
    }

    setGenerating(true);
    try {
      toast.info("Generating video... This may take 30-60 seconds");

      // Send base64 image directly to edge function - it will handle the upload
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            imageData: capturedImage,
            mainText,
            subtext: subtext || undefined,
            duration: '5',
            style: 'boom',
            deviceToken: authToken,
            ...(deviceInfo.playlist_id && { playlistId: deviceInfo.playlist_id })
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      toast.success("Video created and added to playlist!");
      
      // Small delay to show success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate video');
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} disabled={generating}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Offer Video</h1>
            <p className="text-sm text-muted-foreground">
              Snap a photo and add your offer details
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>
              Take a photo of the product or promotion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {capturedImage ? (
              <div className="space-y-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="outline"
                  onClick={handleCapture}
                  className="w-full"
                  disabled={generating}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Retake Photo
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleCapture}
                className="w-full h-48 text-lg"
                variant="outline"
                disabled={generating}
              >
                <Camera className="mr-3 h-8 w-8" />
                Take Photo
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
            <CardDescription>
              What's the offer you want to promote?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="main-text">Main Offer Text *</Label>
              <Input
                id="main-text"
                placeholder="Blueberry Muffins - 50% OFF"
                value={mainText}
                onChange={(e) => setMainText(e.target.value)}
                maxLength={100}
                disabled={generating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtext">Additional Details (Optional)</Label>
              <Textarea
                id="subtext"
                placeholder="Today only until 5pm"
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                maxLength={200}
                rows={2}
                disabled={generating}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={!capturedImage || !mainText.trim() || generating}
          className="w-full h-14 text-lg"
          size="lg"
        >
          {generating ? (
            <>
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
              Generating Video... (this may take 30-60 seconds)
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Video
            </>
          )}
        </Button>

        {generating && (
          <div className="text-center text-sm text-muted-foreground">
            Please wait while we create your promotional video...
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerAICreator;
