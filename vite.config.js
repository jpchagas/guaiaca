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
                description: 'Manage shared budgets, goals, and spending as a couple.',
                start_url: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#1C1C1E',
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
            }
        })
    ]
})