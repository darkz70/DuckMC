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
    proxy: {
      // Реальная цепочка входа Microsoft в браузере (обход CORS через dev-сервер)
      '/msauth/devicecode': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/devicecode/, '/consumers/oauth2/v2.0/devicecode'),
      },
      '/msauth/token': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/token/, '/consumers/oauth2/v2.0/token'),
      },
      '/msauth/xbl': {
        target: 'https://user.auth.xboxlive.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/xbl/, '/user/authenticate'),
      },
      '/msauth/xsts': {
        target: 'https://xsts.auth.xboxlive.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/xsts/, '/xsts/authorize'),
      },
      '/msauth/mclogin': {
        target: 'https://api.minecraftservices.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/mclogin/, '/authentication/login_with_xbox'),
      },
      '/msauth/profile': {
        target: 'https://api.minecraftservices.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/msauth\/profile/, '/minecraft/profile'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
