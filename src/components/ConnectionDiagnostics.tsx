import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Globe, Zap, Activity } from "lucide-react";
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { toast } from "sonner";

const ConnectionDiagnostics = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    wifiName?: string;
    ipAddress?: string;
    latency?: number;
    cloudTest?: boolean;
  }>({});

  const runDiagnostics = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info("Diagnostics only available on mobile devices");
      return;
    }

    setTesting(true);
    const newResults: typeof results = {};

    try {
      // Get network status
      const status = await Network.getStatus();
      
      // Get IP address (available in network status on some devices)
      if (status.connected) {
        // @ts-ignore - ssid might be available
        newResults.wifiName = status.ssid || 'Unknown';
        
        // Try to get IP from various sources
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          newResults.ipAddress = data.ip;
        } catch (e) {
          newResults.ipAddress = 'Unable to detect';
        }
      }

      // Latency test - ping Supabase
      const startTime = performance.now();
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
        });
        const endTime = performance.now();
        newResults.latency = Math.round(endTime - startTime);
      } catch (e) {
        newResults.latency = -1;
      }

      // Cloud function test
      try {
        const testResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlist`,
          {
            method: 'GET',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        newResults.cloudTest = testResponse.ok || testResponse.status === 401; // 401 is ok, means auth is working
      } catch (e) {
        newResults.cloudTest = false;
      }

      setResults(newResults);
      toast.success("Diagnostics complete");
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error("Failed to run diagnostics");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Diagnostics</CardTitle>
        <CardDescription>Test network connectivity and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running Tests...' : 'Run Diagnostics'}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3 pt-2">
            {results.wifiName && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  <span className="font-medium">WiFi Network</span>
                </div>
                <div className="font-bold">{results.wifiName}</div>
              </div>
            )}

            {results.ipAddress && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">IP Address</span>
                </div>
                <div className="font-mono text-sm">{results.ipAddress}</div>
              </div>
            )}

            {results.latency !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Latency</span>
                </div>
                <div className={`font-bold ${results.latency < 100 ? 'text-green-500' : results.latency < 300 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {results.latency >= 0 ? `${results.latency}ms` : 'Failed'}
                </div>
              </div>
            )}

            {results.cloudTest !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <span className="font-medium">Cloud Connection</span>
                </div>
                <div className={`font-bold ${results.cloudTest ? 'text-green-500' : 'text-red-500'}`}>
                  {results.cloudTest ? 'Working' : 'Failed'}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionDiagnostics;
