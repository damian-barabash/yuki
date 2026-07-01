import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (yuki.barabashflow.pl via CNAME) → base '/'
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
