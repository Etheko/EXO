import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable HMR
    hmr: {
      overlay: true, // Show errors as overlay
    },
    // Auto-open browser
    open: true,
    // Configure CORS
    cors: true,
    // Configure proxy for API requests
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Optimize build
  build: {
    sourcemap: true,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  }
})
