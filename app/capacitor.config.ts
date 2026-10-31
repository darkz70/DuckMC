import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duckmc.launcher',
  appName: 'DuckMC',
  webDir: 'dist',
  plugins: {
    // Все fetch идут через нативный слой: без CORS — реальный вход Microsoft в APK
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
