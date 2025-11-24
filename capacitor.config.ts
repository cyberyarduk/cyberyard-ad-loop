import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cyberyard',
  appName: 'Cyberyard',
  webDir: 'dist',
  server: {
    url: 'https://7ab66e3b-b88a-49c6-a3bc-db9036b58b8e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
