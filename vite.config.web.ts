// ══════════════════════════════════════════════════════════
// VITE CONFIG — Build del SPA para deployment web (Vercel)
// Compila solo el renderer (React) como una SPA estándar.
// ══════════════════════════════════════════════════════════

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@components': resolve(__dirname, 'src/renderer/src/components'),
      '@pages': resolve(__dirname, 'src/renderer/src/pages'),
      '@store': resolve(__dirname, 'src/renderer/src/store'),
      '@hooks': resolve(__dirname, 'src/renderer/src/hooks'),
      '@utils': resolve(__dirname, 'src/renderer/src/utils'),
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  // No necesita VITE_API_URL porque la API está en el mismo origen (Vercel)
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(''),
  }
})
