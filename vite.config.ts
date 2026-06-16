import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const repositoryName = runtimeEnv.GITHUB_REPOSITORY?.split('/')[1];
const basePath =
  runtimeEnv.VITE_BASE_PATH ??
  (runtimeEnv.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/');

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'icons/apple-touch-icon.png',
        'icons/pwa-192.png',
        'icons/pwa-512.png'
      ],
      manifest: {
        name: 'Modern Cat Printer PWA',
        short_name: 'CatPrinter',
        description: 'Offline-first thermal print studio for Cat Printer / MXW01.',
        theme_color: '#f4efe5',
        background_color: '#f4efe5',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
});
