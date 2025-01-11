import { defineConfig } from 'vite'

export default defineConfig({
  base: '/data-tumbler-googlesheets/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
