import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface PlayerPairingProps {
  onPaired: (authToken: string, deviceInfo: any) => void;
}

const PlayerPairing = ({ onPaired }: PlayerPairingProps) => {
  const [deviceCode, setDeviceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'choose' | 'manual' | 'qr'>('choose');

  const handlePairing = async () => {
    if (!deviceCode.trim()) {
      toast.error("Please enter a device code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-pair`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ device_code: deviceCode.toUpperCase() })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Pairing failed');
      }

      toast.success("Device paired successfully!");
      onPaired(data.auth_token, {
        device_id: data.device_id,
        device_name: data.device_name,
        company_id: data.company_id,
        playlist_id: data.playlist_id
      });
    } catch (error) {
      console.error('Pairing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pair device');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    // In a real implementation, this would open the camera for QR scanning
    // For now, we'll show a message
    toast.info("QR scanning would open the camera here. Use manual entry for now.");
    setMode('manual');
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Pair Your Device</CardTitle>
            <CardDescription>
              Choose how you'd like to pair this device with Cyberyard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleQRScan}
              className="w-full h-24 text-lg"
              variant="outline"
            >
              <QrCode className="mr-3 h-8 w-8" />
              Scan QR Code
            </Button>
            <Button
              onClick={() => setMode('manual')}
              className="w-full h-24 text-lg"
              variant="outline"
            >
              <Keyboard className="mr-3 h-8 w-8" />
              Enter Device Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enter Device Code</CardTitle>
          <CardDescription>
            Enter the 6-character code from your admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-code">Device Code</Label>
            <Input
              id="device-code"
              placeholder="ABC123"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              autoComplete="off"
            />
          </div>
          <Button
            onClick={handlePairing}
            disabled={loading || deviceCode.length < 6}
            className="w-full"
          >
            {loading ? 'Pairing...' : 'Pair Device'}
          </Button>
          <Button
            onClick={() => setMode('choose')}
            variant="ghost"
            className="w-full"
          >
            Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerPairing;
