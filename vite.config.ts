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
      includeAssets: [
        'icons/icon.svg',
        'logo-yayasan-masyarakat-peduli-pinrang.png',
      ],
      manifest: {
        name: 'Jemput Sampah Pinrang',
        short_name: 'Jemput Sampah',
        description: 'Layanan jemput sampah lokal Pinrang',
        theme_color: '#159fb3',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/app',
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
        globPatterns: ['**/*.{js,css,html,svg,png,webp,geojson}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
