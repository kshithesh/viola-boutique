import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fileURLToPath from 'node:url'

export default defineConfig({
  plugins: [vue()],
  envPrefix: ['VITE_', 'TURSO_'],
  resolve: {
    alias: {
      '@': fileURLToPath.fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true // Error if port is taken, rather than silently switching (breaks Google OAuth)
  }
})
