import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const backendEnvDir = fileURLToPath(new URL('../backend', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // En desarrollo, las variables VITE_* ya configuradas en backend/.env
  // son visibles para Vite. Solo las variables con prefijo VITE_ se exponen.
  envDir: backendEnvDir,
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      // El manifest vive en public/ y se enlaza explícitamente desde index.html.
      // Evita que el plugin genere un segundo manifest/link automáticamente.
      manifest: false
    })
  ]
})
