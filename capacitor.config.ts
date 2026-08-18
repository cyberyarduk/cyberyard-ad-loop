import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.cyberyard.player',
  appName: 'Cyberyard',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#000000',
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 2000,
      launchFadeOutDuration: 500,
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false
    }
  }
};

export default config;
