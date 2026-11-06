import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    cacheDir: '.cache/vite',
    build: { emptyOutDir: false },
    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: Number(env.VITE_DEV_PORT || 5173),
      allowedHosts: (env.VITE_ALLOWED_HOSTS || 'localhost').split(',').map(host => host.trim()).filter(Boolean),
      hmr: env.VITE_HMR_HOST ? {
        host: env.VITE_HMR_HOST,
        protocol: env.VITE_HMR_PROTOCOL === 'wss' ? 'wss' : 'ws',
        clientPort: Number(env.VITE_HMR_CLIENT_PORT || 5173),
      } : undefined,
      proxy: {
        ...(env.VITE_MCP_BRIDGE_ENABLED === 'true' ? { '/assistant-bridge': { target: env.VITE_ASSISTANT_BRIDGE_URL || 'http://127.0.0.1:5188', changeOrigin: true } } : {}),
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5001', changeOrigin: true, secure: false },
      },
    },
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  }
})
