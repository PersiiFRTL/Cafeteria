import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
