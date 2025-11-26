import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.cyberyard.player',
  appName: 'Cyberyard Player',
  webDir: 'dist',
  server: {
    url: 'https://7ab66e3b-b88a-49c6-a3bc-db9036b58b8e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 2000,
      launchFadeOutDuration: 500,
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    }
  }
};

export default config;
