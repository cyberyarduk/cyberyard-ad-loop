import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Device } from '@capacitor/device';

export const useNativeApp = () => {
  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const setupNativeApp = async () => {
      try {
        // Hide splash screen
        await SplashScreen.hide();
        
        // Keep screen awake - prevent screen from turning off
        await KeepAwake.keepAwake();
        
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
        
        // Lock orientation to portrait
        await ScreenOrientation.lock({ orientation: 'portrait' });
        
        // Disable back button on Android (prevent accidental exits)
        const backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
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

        return () => {
          backButtonListener.remove();
        };
      } catch (error) {
        console.error('Error setting up native app:', error);
      }
    };

    setupNativeApp();
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

