import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('pixi')) {
            return 'pixi';
          }
        },
      },
    },
  },
})
