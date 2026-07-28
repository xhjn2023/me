import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages 部署在 /me/ 子路径
  base: '/me/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '我的工作台',
        short_name: '工作台',
        description: '个人移动工作台 - 每天都能用的效率工具',
        theme_color: '#7EB6E6',
        background_color: '#F0F7FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/me/',
        scope: '/me/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 }
})
