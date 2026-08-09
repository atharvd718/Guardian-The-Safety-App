import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon-192x192.png',
        'icon-512x512.png'
      ],
      manifest: {
        name: 'Guardian Safety App',
        short_name: 'Guardian',
        description: 'Your personal women safety assistant',
        theme_color: '#C2185B',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'SOS Emergency',
            short_name: 'SOS',
            description: 'Trigger SOS immediately',
            url: '/?action=sos',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Talk to ARIA',
            short_name: 'ARIA',
            description: 'Open AI safety assistant',
            url: '/?action=aria',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Emergency Helplines',
            short_name: 'Helplines',
            description: 'Call emergency numbers',
            url: '/?action=helplines',
            icons: [{ src: 'icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 31536000
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
