import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Video, ArrowLeft, Phone } from "lucide-react";
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
import PlayerAICreator from "./PlayerAICreator";

interface PlayerAdminModeProps {
  authToken: string;
  deviceInfo: any;
  onExit: () => void;
}

const PlayerAdminMode = ({ authToken, deviceInfo, onExit }: PlayerAdminModeProps) => {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  // Auto-lock after 5 minutes of inactivity
  useState(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (authenticated) {
          toast.info("Admin session timed out");
          onExit();
        }
      }, 5 * 60 * 1000); // 5 minutes
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
  });

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
            onClick={handleForceSync}
          >
            <CardHeader>
              <CardTitle>Force Sync Content</CardTitle>
              <CardDescription>
                {syncing ? 'Syncing...' : 'Refresh playlist and check for new videos'}
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
