import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig((_env) => ({
  envDir: '../../',
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'lovable-uploads/*.png', 'hero-mobile.webp', 'hero-desktop.webp'],
      manifest: {
        name: 'Bikawo - La charge mentale en moins',
        short_name: 'Bikawo',
        description: 'Services d\'assistance familiale combinés avec un seul prestataire de confiance',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['lifestyle', 'productivity'],
        shortcuts: [
          {
            name: 'Réserver un service',
            short_name: 'Réserver',
            url: '/services',
            icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Mon espace',
            short_name: 'Espace',
            url: '/espace-client',
            icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days (reduced for faster updates)
              }
            }
          },
          {
            urlPattern: /^https:\/\/[^.]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bikawo/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
    // Force resolution from apps/public/node_modules for packages that packages/shared uses
    // (pnpm isolated mode: packages/shared has no node_modules of its own)
    dedupe: [
      'react', 'react-dom', '@supabase/supabase-js', 'react-router-dom', 'sonner',
      // shadcn/ui deps — needed because packages/shared has no node_modules of its own
      '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress',
      '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select',
      '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot',
      '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toast',
      '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip',
      'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react',
      'cmdk', 'vaul', 'embla-carousel-react', 'recharts',
      'date-fns', 'react-day-picker', 'react-resizable-panels', 'input-otp',
      'next-themes', 'react-hook-form', 'zod', '@hookform/resolvers',
    ],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        },
      },
    },
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
