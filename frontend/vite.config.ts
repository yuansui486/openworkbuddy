import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './',
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // 代理后端 API 请求到 OpenWorkBuddy 后端
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'antd': ['antd', '@ant-design/icons'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'marked', 'highlight.js']
        }
      }
    }
  }
})
