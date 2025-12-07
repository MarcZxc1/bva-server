import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        // Use VITE_API_URL if set, otherwise try common ports (3000, 5000)
        // The server default is 5000, but it might be running on 3000
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[PROXY ERROR]', err.message);
            console.error('[PROXY TIP] Make sure the server is running. Check:');
            console.error('  1. Server is running: cd server && npm run dev');
            console.error('  2. Server port matches proxy target (default: 3000)');
            console.error('  3. Or set VITE_API_URL environment variable to your server URL');
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (proxyRes.statusCode >= 400) {
              console.warn(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            }
          });
        },
      },
    },
  },
})


