import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.dailyjournal.app',
  appName: 'Daily Journal',
  webDir: 'dist/frontend/browser',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false
  }
};

export default config;
