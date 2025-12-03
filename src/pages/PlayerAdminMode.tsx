import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Video, ArrowLeft, Phone, Wifi, List, Activity, AlertTriangle, RefreshCw, QrCode, PlayCircle } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PlayerAICreator from "./PlayerAICreator";
import PlayerPlaylistManager from "./PlayerPlaylistManager";
import PlayerPlaylistSelector from "./PlayerPlaylistSelector";
import DeviceHealthMonitor from "@/components/DeviceHealthMonitor";
import ConnectionDiagnostics from "@/components/ConnectionDiagnostics";
import QRCode from 'qrcode';

interface PlayerAdminModeProps {
  authToken: string;
  deviceInfo: any;
  onExit: () => void;
}

const PlayerAdminMode = ({ authToken, deviceInfo, onExit }: PlayerAdminModeProps) => {
  // DEBUG: Log to verify latest code is running - v2024-12-03
  console.log('[PlayerAdminMode] Component loaded - version 2024-12-03 with Manage Playlist Videos');
  
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showRepairQR, setShowRepairQR] = useState(false);
  const [repairQRCode, setRepairQRCode] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [reportingProblem, setReportingProblem] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      toast.info("Syncing playlist...");
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync content');
      setSyncing(false);
    }
  };

  const handleEmergencyCall = () => {
    // Trigger emergency call
    window.location.href = 'tel:999';
    toast.error('Calling Emergency Services (999)');
  };

  const handleOpenWiFiSettings = () => {
    if (Capacitor.isNativePlatform()) {
      // Open Android WiFi settings
      if (Capacitor.getPlatform() === 'android') {
        (window as any).cordova?.plugins?.settings?.open('wifi', 
          () => toast.success('Opening WiFi settings...'),
          () => {
            // Fallback: Try to open settings via intent
            window.location.href = 'android.settings.WIFI_SETTINGS';
          }
        );
      }
    } else {
      toast.info('WiFi settings are only available on mobile devices');
    }
  };

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-check-pin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-token': authToken,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ pin })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'PIN check failed');
      }

      if (data.valid) {
        toast.success("Access granted");
        setAuthenticated(true);
      } else {
        toast.error("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch (error) {
      console.error('PIN check error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleReportProblem = async () => {
    setReportingProblem(true);
    try {
      // Collect diagnostics
      const diagnostics = {
        device_id: deviceInfo.device_id,
        device_name: deviceInfo.device_name,
        timestamp: new Date().toISOString(),
        battery: localStorage.getItem('last_battery_level'),
        last_sync: localStorage.getItem('last_playlist_sync'),
        user_agent: navigator.userAgent,
      };

      console.log('Problem report:', diagnostics);
      toast.success("Problem report logged to console");
    } catch (error) {
      console.error('Report error:', error);
      toast.error("Failed to generate report");
    } finally {
      setReportingProblem(false);
    }
  };

  const handleSafeMode = async () => {
    try {
      toast.info("Entering Safe Mode...");
      
      // Clear all caches
      localStorage.removeItem('cached_videos');
      localStorage.removeItem('last_playlist_sync');
      
      // Clear video cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      toast.success("Safe Mode activated. Reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Safe mode error:', error);
      toast.error("Failed to activate Safe Mode");
    }
  };

  const handleShowRepairQR = async () => {
    try {
      // Generate QR code from device pairing token
      const { data: device } = await supabase
        .from('devices')
        .select('pairing_qr_token, device_code')
        .eq('id', deviceInfo.device_id)
        .single();

      if (device?.pairing_qr_token) {
        const qrDataUrl = await QRCode.toDataURL(device.pairing_qr_token, {
          width: 300,
          margin: 2,
        });
        setRepairQRCode(qrDataUrl);
        setShowRepairQR(true);
      } else {
        toast.error("Unable to generate QR code");
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error("Failed to generate QR code");
    }
  };

  // Auto-lock after 2 minutes of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (authenticated) {
          toast.info("Admin session timed out");
          onExit();
        }
      }, 2 * 60 * 1000); // 2 minutes
    };

    if (authenticated) {
      resetTimeout();
      
      // Reset timeout on any interaction
      const handleActivity = () => resetTimeout();
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('click', handleActivity);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [authenticated, onExit]);

  if (showAICreator) {
    return (
      <PlayerAICreator
        authToken={authToken}
        deviceInfo={deviceInfo}
        onBack={() => setShowAICreator(false)}
        onComplete={onExit}
      />
    );
  }

  if (showPlaylistManager) {
    return (
      <PlayerPlaylistManager
        authToken={authToken}
        deviceInfo={deviceInfo}
        onBack={() => setShowPlaylistManager(false)}
      />
    );
  }

  if (showPlaylistSelector) {
    return (
      <PlayerPlaylistSelector
        authToken={authToken}
        deviceInfo={deviceInfo}
        onBack={() => setShowPlaylistSelector(false)}
        onPlaylistChanged={onExit}
      />
    );
  }

  if (showHealthMonitor) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Device Health</h1>
            <Button variant="outline" onClick={() => setShowHealthMonitor(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <DeviceHealthMonitor />
        </div>
      </div>
    );
  }

  if (showDiagnostics) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Connection Diagnostics</h1>
            <Button variant="outline" onClick={() => setShowDiagnostics(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <ConnectionDiagnostics />
        </div>
      </div>
    );
  }

  if (showRepairQR) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Re-Pair Device</CardTitle>
            <CardDescription>
              Scan this QR code to re-pair this device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repairQRCode && (
              <div className="flex justify-center">
                <img src={repairQRCode} alt="Pairing QR Code" className="rounded-lg" />
              </div>
            )}
            <Button
              onClick={() => setShowRepairQR(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 mb-4 text-primary" />
            <CardTitle className="text-2xl">Staff Access</CardTitle>
            <CardDescription>
              Enter your admin PIN to access staff tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePINSubmit} className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Unlock'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onExit}
                className="w-full"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Tools</h1>
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Player
          </Button>
        </div>

        <div className="grid gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowAICreator(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Create Offer Video
              </CardTitle>
              <CardDescription>
                Use the camera to create a quick promotional video
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowPlaylistManager(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Manage Playlist Videos
              </CardTitle>
              <CardDescription>
                Remove expired offers from your playlist
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowPlaylistSelector(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Change Playlist
              </CardTitle>
              <CardDescription>
                Switch to a different playlist
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowHealthMonitor(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Device Health
              </CardTitle>
              <CardDescription>
                View battery, signal, and sync status
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowDiagnostics(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection Diagnostics
              </CardTitle>
              <CardDescription>
                Test WiFi, latency, and cloud connection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleForceSync}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Force Sync Content
              </CardTitle>
              <CardDescription>
                {syncing ? 'Syncing...' : 'Refresh playlist and check for new videos'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleReportProblem}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Report a Problem
              </CardTitle>
              <CardDescription>
                {reportingProblem ? 'Sending report...' : 'Send diagnostics to support'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
            onClick={handleSafeMode}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Safe Mode / Repair
              </CardTitle>
              <CardDescription className="text-yellow-600 dark:text-yellow-400">
                Clear cache and reset device
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleShowRepairQR}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Re-Pair Device
              </CardTitle>
              <CardDescription>
                Show QR code for re-pairing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleOpenWiFiSettings}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                WiFi Settings
              </CardTitle>
              <CardDescription>
                Connect device to WiFi network
              </CardDescription>
            </CardHeader>
          </Card>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-red-500 bg-red-50 dark:bg-red-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Phone className="h-5 w-5" />
                    Emergency - Call 999
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-400">
                    Call emergency services immediately
                  </CardDescription>
                </CardHeader>
              </Card>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Emergency Call Confirmation</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately call 999 (Emergency Services).
                  <br /><br />
                  <strong>Only use in genuine emergencies:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Someone is seriously ill or injured</li>
                    <li>A crime is in progress</li>
                    <li>There is a fire</li>
                    <li>Someone's life is at risk</li>
                  </ul>
                  <br />
                  Are you sure you want to call emergency services?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmergencyCall}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Call 999 Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Device: {deviceInfo.device_name}
        </div>
      </div>
    </div>
  );
};

export default PlayerAdminMode;
