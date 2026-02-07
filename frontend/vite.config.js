import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [react()],
    envDir: '../',
    optimizeDeps: {
      include: ['qrcode.react'],
    },
    server: {
      host: true, // Listen on all network interfaces
      allowedHosts: [
        'localhost',
        '.localhost',
        'sortr',
        '.sortr', // Allows sortr and *.sortr subdomains
      ],
      // Uncomment for maximum flexibility (less secure):
      // allowedHosts: 'all',
    },
  }
})