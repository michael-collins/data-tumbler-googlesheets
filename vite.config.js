import { defineConfig } from 'vite'

export default defineConfig({
  base: '/word-tumbler-googlesheets/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
