import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5173,
    host: true,
    cors: true,
    open: true, // Abre el navegador automáticamente
  },
  // Incluye una configuración específica para que Vite sirva correctamente los archivos CSV
  assetsInclude: ['**/*.csv'],
  // Define alias para facilitar las referencias a archivos
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/src/data',
      '@components': '/src/components',
    },
  },
  // Modo de desarrollo con más mensajes de depuración
  logLevel: 'info'
})
