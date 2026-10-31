import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = 'http://127.0.0.1/it-coffee/backend';
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api':     { target: backend, changeOrigin: true },
      '/uploads': { target: backend, changeOrigin: true },
    },
  },
});
