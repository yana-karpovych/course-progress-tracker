import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API access (dev): browser calls /api/* → Vite proxies to http://localhost:4000/*
// Example: fetch('/api/courses') → http://localhost:4000/courses
// C2 api.ts should use API_BASE = '/api'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
