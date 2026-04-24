import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv อ่าน .env.local ก่อน .env → ใช้สลับ local/production โดยไม่แก้โค้ด
  const env = loadEnv(mode, process.cwd(), '')
  const BE_URL = env.VITE_BE_URL || 'https://wemake-server.onrender.com'

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Dev server proxy — forward /api/* → backend (local or Render)
    server: {
      proxy: {
        '/api': {
          target: BE_URL,
          changeOrigin: true,
        },
        '/health': {
          target: BE_URL,
          changeOrigin: true,
        },
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
