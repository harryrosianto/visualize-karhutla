import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // base path: / untuk domain sendiri atau Cloudflare Pages; /nama-repo/ untuk GitHub Pages tanpa domain khusus
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1800 },
})
