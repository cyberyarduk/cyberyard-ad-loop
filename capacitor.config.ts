import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.cyberyard.player',
  appName: 'Cyberyard Player',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
      backgroundColor: '#000000'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    }
  }
};

export default config;
