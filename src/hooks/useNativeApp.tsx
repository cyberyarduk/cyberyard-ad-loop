import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

export const useNativeApp = () => {
  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const setupNativeApp = async () => {
      try {
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

        // Keep screen awake during playback
        // Note: This is handled automatically by video playback in most cases,
        // but you can add @capacitor-community/keep-awake plugin if needed

        return () => {
          backButtonListener.remove();
        };
      } catch (error) {
        console.error('Error setting up native app:', error);
      }
    };

    setupNativeApp();
  }, []);
};

