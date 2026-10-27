import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '') },
  build: { outDir: 'public', emptyOutDir: true }
});
