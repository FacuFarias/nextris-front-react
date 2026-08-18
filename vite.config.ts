import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Keep previous hashed assets so cached clients do not break during rolling deploys.
    emptyOutDir: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['nextris.cloud', 'clinicacp.ddns.net'],
    hmr: {
      host: 'clinicacp.ddns.net',
      protocol: 'wss',
      clientPort: 3001,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
