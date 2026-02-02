import { defineConfig } from 'vite'

// Set base at build time so assets are referenced from the site domain
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
})
