import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// FST Buddy runs as a plain Vite dev server for local development, and is
// wrapped by Tauri (see src-tauri/) for a packaged desktop build. See
// README.md for both workflows.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
    // Lets the frontend call relative /api paths in dev too, matching
    // production where the backend serves this app from its own origin.
    // Only used when VITE_API_BASE_URL isn't set to an absolute URL.
    proxy: {
      '/api': { target: 'http://127.0.0.1:4317', changeOrigin: true },
    },
  },
});
