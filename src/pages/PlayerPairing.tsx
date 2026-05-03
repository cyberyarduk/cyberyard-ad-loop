import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Keyboard, Tv, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import logo from "@/assets/logo.png";

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

      toast.success(data.recovered ? "Device reconnected successfully!" : "Device paired successfully!");
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

  const handleQRScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info("QR scanning only works on mobile devices. Use manual entry.");
      setMode('manual');
      return;
    }

    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      
      if (camera !== 'granted') {
        toast.error("Camera permission required for QR scanning");
        setMode('manual');
        return;
      }

      document.querySelector('body')?.classList.add('barcode-scanner-active');
      
      const result = await BarcodeScanner.scan();
      
      document.querySelector('body')?.classList.remove('barcode-scanner-active');

      if (result.barcodes && result.barcodes.length > 0) {
        const qrCode = result.barcodes[0].rawValue;
        console.log('QR Code scanned:', qrCode);
        
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
              body: JSON.stringify({ pairing_qr_token: qrCode })
            }
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Pairing failed');
          }

          toast.success(data.recovered ? "Device reconnected successfully!" : "Device paired successfully!");
          onPaired(data.auth_token, {
            device_id: data.device_id,
            device_name: data.device_name,
            company_id: data.company_id,
            playlist_id: data.playlist_id
          });
        } catch (error) {
          console.error('Pairing error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to pair device');
          setMode('manual');
        } finally {
          setLoading(false);
        }
      } else {
        toast.info("No QR code detected. Try again or use manual entry.");
        setMode('manual');
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      toast.error("Failed to scan QR code. Try manual entry.");
      setMode('manual');
    }
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-wash-warm opacity-70" />
        <div className="w-full max-w-md">
          <div className="premium-card card-highlight rounded-3xl p-8 sm:p-10 space-y-8">
            <div className="text-center space-y-3">
              <img src={logo} alt="Cyberyard" className="h-16 mx-auto" />
              <div className="chip bg-mint text-foreground/80">
                <Tv className="h-3.5 w-3.5" />
                Device Setup
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Pair your device</h1>
              <p className="text-sm text-muted-foreground">
                Connect this screen to your Cyberyard account to start playing your content.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleQRScan}
                className="group w-full rounded-2xl border border-border/60 bg-background hover:bg-yellow-soft hover:border-foreground/20 transition-all p-5 flex items-center gap-4 text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-lavender flex items-center justify-center shrink-0">
                  <QrCode className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Scan QR code</p>
                  <p className="text-xs text-muted-foreground">Fastest — point your camera at the code</p>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="group w-full rounded-2xl border border-border/60 bg-background hover:bg-mint hover:border-foreground/20 transition-all p-5 flex items-center gap-4 text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-yellow-soft flex items-center justify-center shrink-0">
                  <Keyboard className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enter device code</p>
                  <p className="text-xs text-muted-foreground">Type the 6-character code from your dashboard</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Need a code? Generate one from your admin dashboard under <span className="font-medium text-foreground/80">Devices</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-wash-warm opacity-70" />
      <div className="w-full max-w-md">
        <div className="premium-card card-highlight rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <img src={logo} alt="Cyberyard" className="h-14 mx-auto" />
            <div className="chip bg-lavender text-foreground/80">
              <Keyboard className="h-3.5 w-3.5" />
              Manual Pairing
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Enter device code</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-character code from your admin dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-code">Device Code</Label>
            <Input
              id="device-code"
              placeholder="ABC123"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest h-14"
              autoComplete="off"
            />
          </div>

          <Button
            onClick={handlePairing}
            disabled={loading || deviceCode.length < 6}
            className="w-full h-11"
          >
            {loading ? 'Pairing…' : 'Pair Device'}
          </Button>

          <Button
            onClick={() => setMode('choose')}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayerPairing;
