import { defineConfig } from 'vite'

export default defineConfig({
  base: '/word-tumbler/', // Replace with your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
