import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — чтобы сборку можно было открыть где угодно
// (Capacitor на Android/iOS, Electron/Tauri на десктопе)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
