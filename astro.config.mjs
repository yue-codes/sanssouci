// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Sin `output: 'server'`: todas las páginas se prerenderizan (HTML estático)
  // salvo las que declaren `export const prerender = false` (las de progreso).
  // El adaptador es el que permite esas páginas de servidor en Cloudflare Workers.
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [preact()]
});
