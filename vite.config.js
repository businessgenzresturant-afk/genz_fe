import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 127.0.0.1 avoids occasional Windows localhost → IPv6 issues; backend must be running on PORT (default 5000)
        target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
