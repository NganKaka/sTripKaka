import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl/')) return 'maplibre';
          if (id.includes('node_modules/react-markdown/') || id.includes('node_modules/remark-gfm/')) return 'markdown';
          if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/motion/')) return 'motion';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) return 'vendor-react';
          if (id.includes('node_modules/lucide-react/')) return 'icons';
        },
      },
    },
  },
});
