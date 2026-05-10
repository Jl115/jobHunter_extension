import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest: 'manifest.json',
      // In dev mode, the plugin injects extra host_permissions for HMR
      // which can collide with the ones we already declared.
      skipManifestValidation: mode === 'development',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}))
