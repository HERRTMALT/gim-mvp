import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vercel sirve los archivos estáticos desde `public/` (los que genera el
  // build del cliente). Desactivamos el `publicDir` de Vite para evitar que
  // intente copiar `public/` sobre sí mismo.
  publicDir: false,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: true,
  },
});
