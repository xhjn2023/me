import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Cloudflare Pages 构建时会注入 CF_PAGES=1，部署在根路径；
// GitHub Pages 部署在 /me/ 子路径。同一份代码自动兼容两种部署。
const base = process.env.CF_PAGES === '1' ? '/' : '/me/'

// 临时禁用 PWA（DISABLE_PWA=1）用于排查 workbox-build 构建问题，默认开启
const enablePwa = process.env.DISABLE_PWA !== '1'

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-fsrs': ['ts-fsrs'],
        }
      }
    }
  },
  plugins: [
    react(),
    enablePwa && VitePWA({
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
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ].filter(Boolean),
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: { host: true, port: 4173 }
})
