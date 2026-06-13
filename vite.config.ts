import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: "SampahTa' Driver",
        short_name: "SampahTa'",
        description: 'PWA petugas jemput sampah Pinrang',
        theme_color: '#166534',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/driver/pickups',
        scope: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
