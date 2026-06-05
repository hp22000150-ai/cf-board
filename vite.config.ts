import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build: {
    outDir: mode === 'pc' ? 'dist-pc' : mode === 'mobile' ? 'dist-mobile' : 'dist',
  },
}))
