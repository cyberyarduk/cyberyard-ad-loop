import { useEffect, useCallback } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Device } from '@capacitor/device';

export const useNativeApp = () => {
  // Keep screen awake function - call periodically to ensure it stays active
  const keepScreenAwake = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await KeepAwake.keepAwake();
      console.log('[KeepAwake] Screen wake lock active');
    } catch (error) {
      console.error('[KeepAwake] Failed to keep screen awake:', error);
    }
  }, []);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let keepAwakeInterval: NodeJS.Timeout;
    let backButtonListener: any;

    const setupNativeApp = async () => {
      try {
        // Hide splash screen
        await SplashScreen.hide();
        console.log('[Native] Splash screen hidden');
        
        // Keep screen awake - prevent screen from turning off
        await KeepAwake.keepAwake();
        console.log('[Native] Initial keep awake set');
        
        // Re-apply keep awake every 30 seconds to ensure it stays active
        keepAwakeInterval = setInterval(async () => {
          try {
            const isAwake = await KeepAwake.isKeptAwake();
            if (!isAwake.isKeptAwake) {
              console.log('[KeepAwake] Re-enabling screen wake lock');
              await KeepAwake.keepAwake();
            }
          } catch (e) {
            console.log('[KeepAwake] Check failed, re-enabling:', e);
            await KeepAwake.keepAwake();
          }
        }, 30000);
        
        // Set screen brightness to maximum (1.0 = 100%)
        try {
          // @ts-ignore - setBrightness is available on Android
          if (Capacitor.getPlatform() === 'android') {
            await (window as any).Brightness?.setBrightness({ brightness: 1.0 });
          }
        } catch (error) {
          console.log('Brightness control not available:', error);
        }
        
        // Hide status bar for fullscreen experience
        await StatusBar.hide();
        console.log('[Native] Status bar hidden');
        
        // Lock orientation to portrait
        await ScreenOrientation.lock({ orientation: 'portrait' });
        console.log('[Native] Orientation locked to portrait');
        
        // Disable back button on Android (prevent accidental exits)
        backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
          // Only allow back navigation on certain screens, not during video playback
          const currentPath = window.location.pathname;
          if (currentPath.includes('/player') && !canGoBack) {
            // Prevent exit from main player screen
            return;
          }
          
          if (canGoBack) {
            window.history.back();
          } else {
            // Show exit confirmation
            if (confirm('Exit Cyberyard Player?')) {
              App.exitApp();
            }
          }
        });
      } catch (error) {
        console.error('Error setting up native app:', error);
      }
    };

    setupNativeApp();

    return () => {
      if (keepAwakeInterval) {
        clearInterval(keepAwakeInterval);
      }
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, []);

  // Get battery info for monitoring
  const getBatteryInfo = async () => {
    try {
      const info = await Device.getBatteryInfo();
      return info.batteryLevel ? Math.round(info.batteryLevel * 100) : null;
    } catch (error) {
      console.log('Battery info not available:', error);
      return null;
    }
  };

  return { getBatteryInfo };
};

