import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  envDir: '../../',
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bikawo/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
    dedupe: [
      'react', 'react-dom', '@supabase/supabase-js', 'react-router-dom', 'sonner',
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
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
