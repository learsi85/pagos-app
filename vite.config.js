import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Apunta al backend en Apache (ajusta si tu ruta es diferente)
        target: 'http://localhost/pagos-app/backend/public',
        changeOrigin: true,
        // Reescribe /api/... → /... (quita el prefijo /api)
        //rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
