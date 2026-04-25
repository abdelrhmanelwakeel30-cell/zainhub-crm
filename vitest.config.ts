import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**', '_DEPRECATED_CRM-dev/**'],
    server: {
      deps: {
        // next-auth uses bare-specifier imports (e.g. 'next/server') that
        // node's ESM loader can't resolve without the .js extension. Inlining
        // routes the import through Vite, which honours our resolve.alias above.
        inline: [/next-auth/, /@auth\//],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // next-auth (and other deps) import the bare specifier 'next/server',
      // but Next 16 ships it as 'next/server.js'. Alias so Vitest resolves it.
      'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
    },
  },
})
