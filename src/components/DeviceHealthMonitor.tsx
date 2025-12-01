import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Wifi, Clock, Thermometer, Zap } from "lucide-react";
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

const DeviceHealthMonitor = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [deviceTemp, setDeviceTemp] = useState<number | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const fetchHealthData = async () => {
      try {
        // Battery info
        const batteryInfo = await Device.getBatteryInfo();
        if (batteryInfo.batteryLevel !== undefined) {
          setBatteryLevel(Math.round(batteryInfo.batteryLevel * 100));
          setIsCharging(batteryInfo.isCharging || false);
        }

        // Network info
        const networkStatus = await Network.getStatus();
        setIsConnected(networkStatus.connected);
        setNetworkType(networkStatus.connectionType);

        // Temperature not available via Capacitor Device API
      } catch (error) {
        console.error('Error fetching health data:', error);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 10000); // Update every 10s

    // Network status listener
    let networkListener: any;
    Network.addListener('networkStatusChange', status => {
      setIsConnected(status.connected);
      setNetworkType(status.connectionType);
    }).then(listener => {
      networkListener = listener;
    });

    return () => {
      clearInterval(interval);
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  // Update last sync from localStorage
  useEffect(() => {
    const syncTime = localStorage.getItem('last_playlist_sync');
    if (syncTime) {
      setLastSync(new Date(syncTime));
    }
  }, []);

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="h-5 w-5" />;
    if (isCharging) return <Zap className="h-5 w-5 text-green-500" />;
    if (batteryLevel < 20) return <Battery className="h-5 w-5 text-red-500" />;
    if (batteryLevel < 50) return <Battery className="h-5 w-5 text-yellow-500" />;
    return <Battery className="h-5 w-5 text-green-500" />;
  };

  const getSignalIcon = () => {
    if (!isConnected) return <Wifi className="h-5 w-5 text-red-500" />;
    return <Wifi className="h-5 w-5 text-green-500" />;
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Health</CardTitle>
        <CardDescription>Current device status and diagnostics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBatteryIcon()}
            <span className="font-medium">Battery</span>
          </div>
          <div className="text-right">
            <div className="font-bold">
              {batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isCharging ? 'Charging' : 'Not charging'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSignalIcon()}
            <span className="font-medium">Connection</span>
          </div>
          <div className="text-right">
            <div className="font-bold capitalize">{networkType}</div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Last Sync</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatTimeSince(lastSync)}</div>
          </div>
        </div>

        {deviceTemp !== null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              <span className="font-medium">Temperature</span>
            </div>
            <div className="text-right">
              <div className="font-bold">{deviceTemp}°C</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceHealthMonitor;
