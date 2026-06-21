import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serve a partir da raiz — base padrão "/"
export default defineConfig({
  plugins: [react()],
})
