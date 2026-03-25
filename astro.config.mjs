// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Use VERCEL_URL for production, fallback to env var or localhost
  site: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  output: 'server',

  // Security configuration for Astro 5
  security: {
    // Disable Astro's built-in CSRF check since we have our own CSRF implementation
    csrfProtection: {
      origin: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),

  integrations: [mdx()],
});