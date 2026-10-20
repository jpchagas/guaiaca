import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Guaiaca',
        short_name: 'Guaiaca',
        description: 'Finanças pessoais e compartilhadas: transações, orçamentos e metas.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F4EF',
        theme_color: '#0D1F18',
        orientation: 'portrait',
        icons: [
          {
            src: '192_file.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '512_file.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Permite cachear arquivos grandes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      }
    })
  ],
  build: {
    // Aumenta o limite de aviso de chunk
    chunkSizeWarningLimit: 1000, // 1 MB
    rollupOptions: {
      output: {
        // Divide bibliotecas grandes em chunks separados
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          recharts: ['recharts'],
          utils: ['date-fns', 'lodash']
        }
      }
    }
  }
})
